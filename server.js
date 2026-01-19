// ==========================
// 1. Imports & Config
// ==========================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// ==========================
// 2. App Initialization
// ==========================
const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// 3. OpenAI Client
// ==========================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  if (preset === "apology") {
    presetInstruction = "Reply with empathy and apology.";
  } else if (preset === "closure") {
    presetInstruction = "Politely close the conversation.";
  } else if (preset === "callback") {
    presetInstruction = "Confirm callback clearly.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Fitelo customer support assistant.

${presetInstruction}

Rules:
- Short WhatsApp replies
- Polite Indian English
- Natural, not robotic

Generate exactly 3 replies.
Only replies, no explanation.
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const replies = completion.choices[0].message.content
      .split("\n")
      .filter(Boolean);

    res.json({ replies });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// Fix draft
app.post("/fix-draft", async (req, res) => {
  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: "Draft required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Rewrite into polite WhatsApp English." },
        { role: "user", content: draft }
      ]
    });

    res.json({ fixed: completion.choices[0].message.content.trim() });

  } catch (err) {
    res.status(500).json({ error: "Fix draft failed" });
  }
});

// ==========================
// 5. Server Start
// ==========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
