// src/utils/aiGroq.js
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate quiz questions with Groq AI
 */
async function generateQuiz({ grade, subject, totalQuestions = 10, difficulty = "MEDIUM" }) {
  const prompt = `
  Generate ${totalQuestions} ${difficulty} level quiz questions for grade ${grade} students
  in the subject of ${subject}.
  Format JSON as:
  [
    {
      "text": "question here",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": "A",
      "hint": "short hint here",
      "difficulty": "${difficulty}"
    }
  ]
  `;

  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-70b-versatile",
    temperature: 0.7,
    max_tokens: 800
  });

  const content = response.choices[0]?.message?.content || "[]";

  try {
    return JSON.parse(content);
  } catch {
    console.error("Groq returned unparsable output:", content);
    return [];
  }
}

/**
 * Generate hint for a single question
 */
async function getHint(questionText) {
  const prompt = `Provide a short hint for this quiz question: "${questionText}"`;
  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-70b-versatile",
    temperature: 0.5,
    max_tokens: 100
  });

  return response.choices[0]?.message?.content || "Think step by step.";
}

/**
 * Generate improvement suggestions based on mistakes
 */
async function getSuggestions(mistakes) {
  const mistakeList = mistakes.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
  const prompt = `
  A student made these mistakes:
  ${mistakeList}

  Suggest 2 concrete improvement tips.
  `;

  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-70b-versatile",
    temperature: 0.7,
    max_tokens: 150
  });

  return response.choices[0]?.message?.content.split("\n").filter(Boolean).slice(0, 2);
}

module.exports = { generateQuiz, getHint, getSuggestions };
