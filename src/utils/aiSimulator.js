// src/utils/aiGroq.js
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateQuiz({ grade, subject, totalQuestions = 10, difficulty = "MEDIUM" }) {
  const prompt = `
    Generate ${totalQuestions} ${difficulty} level quiz questions for grade ${grade} in ${subject}.
    Output in JSON array with fields text, options, correctOption, hint, difficulty.
  `;

  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",        // <- use a supported model
    temperature: 0.7,
    max_tokens: 800
  });

  const content = response.choices[0]?.message?.content || "[]";
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Groq output parse error:", content, err);
    return [];
  }
}

async function getHint(questionText) {
  const prompt = `Provide a short helpful hint for this question: "${questionText}"`;
  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
    temperature: 0.5,
    max_tokens: 100
  });
  return response.choices[0]?.message?.content || "Think step by step.";
}

async function getSuggestions(mistakes) {
  const mistakeList = mistakes.map((m,i) => `${i+1}. ${m.text}`).join("\n");
  const prompt = `
    The student made these mistakes:
    ${mistakeList}
    Suggest 2 improvement tips.
  `;
  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
    temperature: 0.7,
    max_tokens: 150
  });
  return response.choices[0]?.message?.content.split("\n").filter(Boolean).slice(0,2);
}

module.exports = { generateQuiz, getHint, getSuggestions };
