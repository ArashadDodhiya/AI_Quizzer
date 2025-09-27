// src/utils/aiGroq.js
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Recommended model: "llama-3.3-70b-versatile" or "llama-3.1-8b-instant"
const DEFAULT_MODEL = "llama-3.1-8b-instant";

// Helper function to extract JSON from AI response
function extractJSON(text) {
  try {
    const match = text.match(/\[.*\]/s); // match from first [ to last ] (dotall)
    if (match) return JSON.parse(match[0]);
  } catch (err) {
    console.error("Failed to parse JSON:", err, text);
  }
  return [];
}

async function generateQuiz({ grade, subject, totalQuestions = 10, difficulty = "MEDIUM" }) {
  const prompt = `
    Generate ${totalQuestions} ${difficulty} level quiz questions for grade ${grade} in ${subject}.
    Output in JSON array with fields: text, options, correctOption, hint, difficulty.
  `;

  try {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || "";
    return extractJSON(content);
  } catch (err) {
    console.error("Error generating quiz:", err);
    return [];
  }
}

async function getHint(questionText) {
  const prompt = `Provide a short helpful hint for this question: "${questionText}"`;

  try {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: DEFAULT_MODEL,
      temperature: 0.5,
      max_tokens: 100
    });

    const content = response.choices[0]?.message?.content || "";
    // Remove any prepended text
    return extractJSON(`[${content}]`)[0]?.text || content.trim() || "Think step by step.";
  } catch (err) {
    console.error("Error generating hint:", err);
    return "Think step by step.";
  }
}

async function getSuggestions(mistakes) {
  const mistakeList = mistakes.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
  const prompt = `
    The student made these mistakes:
    ${mistakeList}
    Suggest 2 improvement tips.
  `;

  try {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 150
    });

    const content = response.choices[0]?.message?.content || "";
    return content.split("\n").filter(Boolean).slice(0, 2);
  } catch (err) {
    console.error("Error generating suggestions:", err);
    return [];
  }
}

module.exports = { generateQuiz, getHint, getSuggestions };
