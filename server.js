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
// 3. OpenAI Client Setup
// ==========================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ==========================
// 4. Routes
// ==========================

// --------------------------------
// Generate Replies (with Presets)
// --------------------------------
app.post("/generate-replies", async (req, res) => {
  const { message, preset } = req.body;

  // Validation
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Preset-aware instruction
    let presetInstruction = "";
    if (preset === "apology") {
      presetInstruction = `
The reply intent is "apology".

Rules for apology replies:
- Be empathetic and apologetic
- Acknowledge the inconvenience or issue
- Show understanding of the customer's concern
- Offer reassurance or next steps
`;
    } else if (preset === "closure") {
      presetInstruction = `
The reply intent is "closure".

Rules for closure replies:
- Politely close the conversation
- Thank the customer for their time
- Offer final assistance if needed
- End on a positive, warm note
`;
    } else if (preset === "callback") {
      presetInstruction = `
The reply intent is "callback".

Rules for callback replies:
- Clearly confirm that a call will be made
- Mention when they can expect the call (if known)
- Provide reassurance about the callback
- Keep it brief and action-oriented
`;
    }

    // OpenAI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a customer support assistant for Fitelo, a health and wellness company.

${presetInstruction}

Tone Rules:
- Use simple, polite Indian business English
- Sound warm, supportive, and human
- Keep replies short and WhatsApp-friendly
- Avoid formal phrases like "we look forward to seeing you"
- Prefer phrases like "we’ll connect with you" or "our team will reach out"

Task:
Generate 3 replies suitable for the given intent.
Only output the replies. No explanations.
          `
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    // Parse replies
    const replies = completion.choices[0].message.content
      .split("\n")
      .filter(r => r.trim());

    res.json({ replies });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});


// --------------------------------
// Fix My Draft
// --------------------------------
app.post("/fix-draft", async (req, res) => {
  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: "Draft is required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Rewrite the text into polite, professional WhatsApp-ready English.
Keep it short, clear, and natural.
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

  } catch (error) {
    console.error("Fix Draft Error:", error);
    res.status(500).json({ error: "Failed to fix draft" });
  }
});


// ==========================
// 5. Server Start
// ==========================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
