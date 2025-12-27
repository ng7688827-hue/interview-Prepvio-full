import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FIREWORKS_API_KEY = 'fw_3ZbHnsRsTg9cHxxESpgxzMim';
const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

/* ==========================================================
   🔹 NORMAL INTERVIEW QUESTION (OPTIONAL)
========================================================== */
export const getInterviewQuestion = async (req, res) => {
  const { chatHistory, companyType, role } = req.body;

  if (!chatHistory || !companyType || !role) {
    return res.status(400).json({ message: "Missing required interview parameters." });
  }

  try {
    const systemPrompt = `
You are a professional interviewer at a ${companyType}.
Ask one question at a time. No explanations. Start with intro → technical.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }))
    ];

    const response = await axios.post(
      FIREWORKS_URL,
      {
        model: "accounts/fireworks/models/deepseek-v3p1",
        messages
      },
      {
        headers: {
          Authorization: `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || "";
    res.json({ text });

  } catch (err) {
    console.error("Interview Question Error:", err);
    res.status(500).json({ message: "Failed to generate question" });
  }
};



/* ==========================================================
   🔥 PERFECT FIREWORKS CODING PROBLEM GENERATOR
   - Returns ONLY valid JSON
   - No raw data
   - Always parses JSON safely
========================================================== */
export const generateCodingProblem = async (req, res) => {
  try {
    const randomSeed = Math.floor(Math.random() * 100000);
    const topics = [
      "math operations", "logic gates", "comparisons",
      "conditions", "loops", "basic algorithms"
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const prompt = `
Generate a beginner-friendly coding problem using two integer inputs a and b.

Topic: ${topic}
Seed: ${randomSeed}

Respond ONLY with valid JSON.
NO markdown. NO text outside the JSON.

Expected JSON format:
{
  "problemId": "unique_id",
  "title": "Problem Title",
  "description": "One-sentence clear problem statement.",
  "example": "Input: a = 3, b = 5\\nOutput: 8",
  "functionName": "functionName",
  "companies": ["Google","Amazon","Microsoft"],
  "boilerplate": {
    "javascript": "function functionName(a,b){\\n  // code\\n}",
    "cpp": "#include <iostream>... ",
    "python": "def functionName(a,b):\\n  pass"
  },
  "testCases": [
    { "input": "1, 2", "expected": "3" },
    { "input": "5, 3", "expected": "8" }
  ]
}
RETURN ONLY JSON.
`;

    // Call Fireworks
    const response = await axios.post(
      FIREWORKS_URL,
      {
        model: "accounts/fireworks/models/deepseek-v3p1",
        messages: [
          {
            role: "system",
            content: "You output ONLY valid JSON. No explanations ever."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Extract JSON text
    const raw = response.data?.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ error: "Empty Fireworks response" });
    }

    let clean = raw.replace(/```json|```/g, "").trim();

    const match = clean.match(/\{[\s\S]*\}$/);
    if (!match) {
      return res.status(500).json({ error: "JSON not found in response", raw });
    }

    const parsed = JSON.parse(match[0]);

    // Return ONLY parsed JSON
    res.json(parsed);

  } catch (err) {
    console.error("🔥 Coding Problem Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Fireworks coding problem generation failed",
      details: err.response?.data || err.message
    });
  }
};


export default {
  getInterviewQuestion,
  generateCodingProblem,
};
