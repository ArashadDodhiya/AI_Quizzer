// src/utils/aiSimulator.js
const { v4: uuidv4 } = require('uuid');

/**
 * Simple question generator: For real app, call an external AI.
 * Here we simulate questions for Maths grade N using templates.
 */
function generateQuestion({ grade, subject, difficulty }) {
  // difficulty can be EASY/MEDIUM/HARD
  const id = uuidv4();
  const base = grade || 5;
  const diffFactor = difficulty === 'HARD' ? 3 : difficulty === 'MEDIUM' ? 2 : 1;
  // Create simple arithmetic question
  const a = Math.floor(Math.random() * (10 * diffFactor)) + base;
  const b = Math.floor(Math.random() * (10 * diffFactor)) + 1;
  const correct = a + b;
  const options = [
    String(correct),
    String(correct + Math.floor(Math.random() * 5) + 1),
    String(correct - (Math.floor(Math.random() * 3) + 1)),
    String(correct + (Math.floor(Math.random() * 6) + 2))
  ];
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  // Map to letters A-D
  const optionObjects = options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`);
  const correctIndex = options.findIndex((o) => o === String(correct));
  const correctOption = String.fromCharCode(65 + correctIndex);

  const hint = `Try adding ${a} and ${b}: think of ${a}+${b} as ${a}+${b}. Break numbers into tens/ones if needed.`;

  return {
    text: `What is ${a} + ${b}?`,
    options: optionObjects,
    correctOption,
    hint,
    grade,
    subject,
    difficulty
  };
}

/**
 * Generate a balanced quiz: attempt to use history to bias difficulty distribution.
 * pastPerformance: object {easyCorrectRate, mediumCorrectRate, hardCorrectRate}
 */
function makeQuizPayload({ grade, subject, totalQuestions = 10, maxScore = 10, pastPerformance = null }) {
  // default distribution: 50% easy, 30% medium, 20% hard
  let easy = Math.round(totalQuestions * 0.5);
  let medium = Math.round(totalQuestions * 0.3);
  let hard = totalQuestions - easy - medium;

  if (pastPerformance) {
    // If user struggles with hard, reduce hard count; if excels increase.
    if (pastPerformance.hardCorrectRate != null) {
      if (pastPerformance.hardCorrectRate < 0.5) hard = Math.max(0, hard - 1);
      else if (pastPerformance.hardCorrectRate > 0.8) hard = Math.min(totalQuestions, hard + 1);
    }
    // adjust medium similarly
    if (pastPerformance.mediumCorrectRate != null) {
      if (pastPerformance.mediumCorrectRate < 0.5) medium = Math.max(0, medium - 1);
      else if (pastPerformance.mediumCorrectRate > 0.8) medium = Math.min(totalQuestions - hard, medium + 1);
    }
    easy = totalQuestions - medium - hard;
  }

  const difficulties = [
    ...Array(easy).fill('EASY'),
    ...Array(medium).fill('MEDIUM'),
    ...Array(hard).fill('HARD')
  ];

  // shuffle difficulties
  for (let i = difficulties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [difficulties[i], difficulties[j]] = [difficulties[j], difficulties[i]];
  }

  const questions = difficulties.map((d) => generateQuestion({ grade, subject, difficulty: d }));
  return { questions, difficultyDistribution: { easy, medium, hard }, totalQuestions, maxScore };
}

/**
 * Generate hint for a question: return hint string.
 */
function generateHintForQuestion(question) {
  // Here question contains text/options — we return stored hint or a small transformation
  if (question.hint) return question.hint;
  return `Think about the main operation asked. Break the problem into smaller steps.`;
}

/**
 * Evaluate submission and produce suggestions.
 * - responses: [{ question, userResponse }]
 */
function evaluateSubmission(quiz, submissionResponses) {
  // quiz.questions should be populated with Question docs
  let score = 0;
  const perQuestionScore = quiz.maxScore / quiz.totalQuestions;

  const mistakes = [];

  for (const resp of submissionResponses) {
    const q = quiz.questions.find((x) => String(x._id) === String(resp.question));
    if (!q) continue;
    if (resp.userResponse === q.correctOption) {
      score += perQuestionScore;
    } else {
      mistakes.push({
        questionId: q._id,
        text: q.text,
        correctOption: q.correctOption,
        userResponse: resp.userResponse
      });
    }
  }

  // Suggestions: analyze mistake patterns
  const suggestions = [];
  if (mistakes.length === 0) {
    suggestions.push('Great job! Keep practicing similar questions to maintain speed.');
    suggestions.push('Try increasing challenge by attempting harder problems.');
  } else {
    suggestions.push(`Review the ${mistakes.length} question(s) you missed; focus on step-by-step calculation.`);
    suggestions.push('Practice partitioning numbers and estimation to reduce careless mistakes.');
  }

  return {
    score: Math.round(score * 100) / 100,
    maxScore: quiz.maxScore,
    mistakes,
    suggestions
  };
}

module.exports = {
  generateQuestion,
  makeQuizPayload,
  generateHintForQuestion,
  evaluateSubmission
};
