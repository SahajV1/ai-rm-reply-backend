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
// 3. Grok (xAI) Client
// ==========================
const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1"
});

const MODEL = "grok-2-latest";

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
    presetInstruction = "Apologise sincerely and reassure support.";
  } else if (preset === "closure") {
    presetInstruction = "Politely close the conversation if appropriate.";
  } else if (preset === "callback") {
    presetInstruction = "Request call availability or inform about a callback.";
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `
You are a human customer support executive replying on WhatsApp.
${presetInstruction}

Guidelines:
- Polite, calm Indian English
- Short, natural, human-sounding replies
- Third person only
- Do NOT use the brand name
- Do NOT use I, me, or we
- Do NOT force phrases like "our team" or "our Relationship Manager"
- Using "our" is allowed when it feels natural
- Avoid unnecessary "thank you" and over-politeness

Reply rules:
- Generate exactly 3 replies
- WhatsApp-ready
- No emojis
- No explanations or numbering
`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.3
    });

    const replies = completion.choices[0].message.content
      .split("\n")
      .filter(Boolean);

    res.json({ replies });

  } catch (err) {
    console.error("Grok error:", err);
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
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `
Rewrite this into natural WhatsApp-style Indian English.

Rules:
- Third person
- No brand name
- No forced phrases
- Using "our" is allowed only if it sounds natural
- No unnecessary "thank you"
- Keep it short and human
`
        },
        {
          role: "user",
          content: draft
        }
      ],
      temperature: 0.25
    });

    res.json({
      fixed: completion.choices[0].message.content.trim()
    });

  } catch (err) {
    console.error("Grok error:", err);
    res.status(500).json({ error: "Fix draft failed" });
  }
});

// ==========================
// 5. Server Start
// ==========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🤖 Using Grok model: ${MODEL}`);
});
