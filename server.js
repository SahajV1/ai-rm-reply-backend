// ==========================
// 1. Imports & Config
// ==========================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// ==========================
// 2. App Initialization
// ==========================
const app = express();
app.use(cors());
app.use(express.json());


// ==========================
// 3. Hugging Face Config
// ==========================
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

async function queryHF(prompt) {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 120,
        temperature: 0.3,
        return_full_text: false
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data[0]?.generated_text?.trim();
}


// ==========================
// 4. Routes
// ==========================

// Generate replies
app.post("/generate-replies", async (req, res) => {
  const { message, preset } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  let presetInstruction = "";
  if (preset === "apology") presetInstruction = "Apologise sincerely.";
  if (preset === "closure") presetInstruction = "Politely close the conversation.";
  if (preset === "callback") presetInstruction = "Ask for callback availability.";

  const prompt = `
You are a human customer support executive replying on WhatsApp.

${presetInstruction}

Rules:
- Polite Indian English
- Third person only
- No brand name
- No emojis
- Generate exactly 3 short replies
- Each reply on a new line

Customer message:
"${message}"
`;

  try {
    const text = await queryHF(prompt);

    const replies = text
      .split("\n")
      .map(r => r.trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ replies });

  } catch (err) {
    console.error("HF error:", err.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// Fix draft
app.post("/fix-draft", async (req, res) => {
  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: "Draft required" });
  }

  const prompt = `
Rewrite the following message into natural WhatsApp-style Indian English.

Rules:
- Third person
- No brand name
- No unnecessary politeness
- Keep it short and human

Message:
"${draft}"
`;

  try {
    const fixed = await queryHF(prompt);
    res.json({ fixed });

  } catch (err) {
    console.error("HF error:", err.message);
    res.status(500).json({ error: "Fix draft failed" });
  }
});

// ==========================
// 5. Server Start
// ==========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🤖 Using Hugging Face model: ${HF_MODEL}`);
});
