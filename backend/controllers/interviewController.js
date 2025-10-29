import dotenv from "dotenv";
dotenv.config();

// ✅ Load Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Use a valid existing model
const GEMINI_MODEL = "gemini-2.5-flash";

// ✅ Correct API Endpoint
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
// ✅ Convert your chat into Gemini format
const formatHistoryForApi = (history) =>
  history.map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));

// ✅ Main interview function
// Main function to call the Gemini API
const getInterviewQuestion = async (req, res) => {
  const { chatHistory, companyType, role } = req.body;

  if (!chatHistory || !companyType || !role) {
    return res.status(400).json({ message: "Missing required interview parameters." });
  }

  try {
    const systemPrompt = `You are a highly skilled and professional Senior Tech Interviewer for a ${companyType} company, hiring for a ${role} position. Your goal is to assess the candidate's technical skills, problem-solving abilities, and fit for the company culture.

Rules of the interview:
1. Start the interview with standard, fixed introductory questions.
2. Then transition to technical questions.
3. Generate the next question based on candidate answers.
4. Professional tone only.
5. Output only the interview question.`;

    const formattedHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...chatHistory.map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text }]
      })),
    ];

    const payload = { contents: formattedHistory };

    const apiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini Error:", result);
      return res.status(apiResponse.status).json({ message: result.error?.message || "External API error" });
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Malformed Gemini response:", result);
      return res.status(500).json({ message: "AI returned empty response." });
    }

    res.json({ text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: "Internal server error during interview question generation." });
  }
};


export default {
  getInterviewQuestion
};

