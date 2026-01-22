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
    presetInstruction = "The reply should sincerely apologise for the inconvenience and reassure support.";
  } else if (preset === "closure") {
    presetInstruction = "The reply should politely close the conversation and offer further help if needed.";
  } else if (preset === "callback") {
    presetInstruction = "The reply should request call availability or inform about a callback clearly.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Fitelo customer support assistant.

Your replies must closely match how Fitelo Relationship Managers communicate on WhatsApp.

${presetInstruction}

Tone & Style Guidelines:
- Polite, calm, and reassuring
- Professional but warm (not robotic, not casual)
- Indian English suitable for WhatsApp
- Short, clear, and human-sounding sentences

Point of View:
- Always reply in third person as Fitelo
- Use phrases like “Fitelo team”, “our Relationship Manager”, “our team”
- Do NOT use “I”, “me”, or “we”

Language Preferences:
- Common phrases to use when suitable:
  - “Kindly allow us some time”
  - “Please let us know your availability”
  - “One of our agents will get in touch with you”
  - “Our Relationship Manager tried reaching out”
  - “We sincerely apologise for the inconvenience caused”
  - “For better assistance, a call would be helpful”

Reply Rules:
- Generate exactly 3 reply options
- Each reply must be WhatsApp-ready
- No emojis
- No explanations, labels, or numbering
- Replies should sound like a real Fitelo RM

Task:
Respond to the user message below following all the above guidelines.
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
        {
          role: "system",
          content: `
Rewrite the message into polite WhatsApp-style Indian English as used by Fitelo Relationship Managers.

Rules:
- Third person only (Fitelo / our team / Relationship Manager)
- Professional, calm, and reassuring
- No emojis
- Do NOT use I, me, or we
`
        },
        {
          role: "user",
          content: draft
        }
      ]
    });

    res.json({
      fixed: completion.choices[0].message.content.trim()
    });

  } catch (err) {
    console.error(err);
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
