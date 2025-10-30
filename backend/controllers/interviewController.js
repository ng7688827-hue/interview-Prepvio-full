import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ✅ Format conversation history for Gemini API
const formatHistory = (history) =>
  history.map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));

// ✅ Main AI Interview Function
const getInterviewQuestion = async (req, res) => {
  const { chatHistory, companyType, role, userId } = req.body;

  if (!chatHistory || !companyType || !role) {
    return res.status(400).json({ message: "Missing required interview parameters." });
  }

  try {
    const systemPrompt = `You are a highly skilled and professional technical interviewer for a ${companyType} company, hiring for a ${role} position.
Follow these strict rules:
1. Begin with standard introductory questions (e.g., "Introduce yourself").
2. Progress to technical and scenario-based questions.
3. Follow up based on candidate's responses.
4. Maintain a professional, polite tone.
5. Respond with only one question at a time.`;

    const formattedHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...formatHistory(chatHistory),
    ];

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: formattedHistory }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", result);
      return res.status(response.status).json({
        message: result.error?.message || "Gemini API request failed",
      });
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Malformed Gemini response:", result);
      return res.status(500).json({ message: "AI returned empty response." });
    }

    res.json({ text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: "Internal server error during interview generation." });
  }
};

export default { getInterviewQuestion };
