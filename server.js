// ==========================
// 1. Imports & Config
// ==========================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();


// ==========================
// 2. App Initialization
// ==========================
const app = express();
app.use(cors());
app.use(express.json());


// ==========================
// 3. Gemini Client Setup
// ==========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// ==========================
// 4. Routes
// ==========================

// --------------------------------
// Generate Replies (with Presets)
// --------------------------------
app.post("/generate-replies", async (req, res) => {
  const { message, preset } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    let presetInstruction = "";

    if (preset === "apology") {
      presetInstruction = `
The reply intent is "apology".
- Be empathetic and apologetic
- Acknowledge inconvenience
- Reassure the customer
`;
    } else if (preset === "closure") {
      presetInstruction = `
The reply intent is "closure".
- Politely close the conversation
- Thank the customer
- End positively
`;
    } else if (preset === "callback") {
      presetInstruction = `
The reply intent is "callback".
- Confirm a callback
- Mention timing if possible
- Keep it brief
`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are a customer support assistant for Fitelo, a health and wellness company.

${presetInstruction}

Tone Rules:
- Simple, polite Indian business English
- Warm and human
- Short WhatsApp-friendly replies
- Avoid formal language

Task:
Generate exactly 3 replies.
Return each reply on a new line.

Customer message:
"${message}"
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const replies = text
      .split("\n")
      .map(r => r.replace(/^[0-9.\-•]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3); // safety cap

    res.json({ replies });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});


// --------------------------------
// Fix My Draft (Gemini)
// --------------------------------
app.post("/fix-draft", async (req, res) => {
  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: "Draft is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Rewrite the following text into polite, professional WhatsApp-ready English.
Keep it short, clear, and natural.

Text:
"${draft}"
`;

    const result = await model.generateContent(prompt);

    res.json({
      fixed: result.response.text().trim()
    });

  } catch (error) {
    console.error("Fix Draft Error:", error);
    res.status(500).json({ error: "Failed to fix draft" });
  }
});


// ==========================
// 5. Server Start
// ==========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});




