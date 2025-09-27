// src/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
// switched from simulator to Groq AI
const ai = require('../utils/aiSimulator');
const mongoose = require('mongoose');

/**
 * Generate a new quiz (AI -> Groq)
 * Body: { grade, subject, totalQuestions, maxScore, difficulty (optional) }
 */
exports.generateQuiz = async (req, res) => {
  try {
    const { grade, subject, totalQuestions = 10, maxScore = 10, difficulty = 'MEDIUM' } = req.body;
    if (!grade || !subject) {
      return res.status(400).json({ error: 'grade and subject required' });
    }

    // Call Groq AI to generate questions
    const questions = await ai.generateQuiz({ grade, subject, totalQuestions, difficulty });

    if (!questions || questions.length === 0) {
      return res.status(500).json({ error: 'AI failed to generate quiz questions' });
    }

    // Save questions in DB
    const questionDocs = await Question.insertMany(questions);

    const quiz = await Quiz.create({
      creator: req.user._id,
      grade,
      subject,
      totalQuestions,
      maxScore,
      difficultyDistribution: { easy: 0, medium: totalQuestions, hard: 0 }, // default since Groq decides difficulty
      questions: questionDocs.map((q) => q._id)
    });

    // populate questions for response
    const populated = await Quiz.findById(quiz._id).populate('questions');

    res.json({ quiz: populated });
  } catch (err) {
    console.error('Error generating quiz:', err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Ask for a hint for a question
 * GET /api/quizzes/:quizId/hint?questionId=...
 */
exports.getHint = async (req, res) => {
  try {
    const { questionId } = req.query;
    if (!questionId) return res.status(400).json({ error: 'questionId required' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'question not found' });

    // Groq hint
    const hint = await ai.getHint(question.text);
    res.json({ hint });
  } catch (err) {
    console.error('Error getting hint:', err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Submit answers and return evaluated score.
 * Body: { quizId, responses: [{ questionId, userResponse }] }
 */
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, responses } = req.body;
    if (!quizId || !responses) {
      return res.status(400).json({ error: 'quizId and responses required' });
    }

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) return res.status(404).json({ error: 'quiz not found' });

    let score = 0;
    const perQuestionScore = quiz.maxScore / quiz.totalQuestions;
    const mistakes = [];

    for (const resp of responses) {
      const q = quiz.questions.find((x) => String(x._id) === String(resp.questionId));
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

    // Get AI suggestions for improvement
    const suggestions = await ai.getSuggestions(mistakes);

    // Save submission
    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user._id,
      responses: responses.map((r) => ({ question: r.questionId, userResponse: r.userResponse })),
      score,
      maxScore: quiz.maxScore,
      isRetry: false
    });

    res.json({
      submissionId: submission._id,
      score,
      maxScore: quiz.maxScore,
      mistakes,
      suggestions
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Quiz history & score retrieval with filters
 * GET /api/quizzes/history?grade=5&subject=Maths&minMarks=5&from=2024-09-01&to=2024-09-09
 */
exports.getHistory = async (req, res) => {
  try {
    const { grade, subject, minMarks, maxMarks, from, to, page = 1, limit = 30 } = req.query;
    const filter = { user: req.user._id };

    if (grade) {
      const quizzes = await Quiz.find({ grade: Number(grade) }).select('_id');
      filter.quiz = { $in: quizzes.map((q) => q._id) };
    }

    if (subject) {
      const quizzes = await Quiz.find({ subject }).select('_id');
      filter.quiz = filter.quiz
        ? { $in: quizzes.map((q) => q._id) }
        : { $in: quizzes.map((q) => q._id) };
    }

    if (minMarks || maxMarks) {
      filter.score = {};
      if (minMarks) filter.score.$gte = Number(minMarks);
      if (maxMarks) filter.score.$lte = Number(maxMarks);
    }

    if (from || to) {
      filter.completedAt = {};
      if (from) filter.completedAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.completedAt.$lte = toDate;
      }
    }

    const submissions = await Submission.find(filter)
      .populate({ path: 'quiz', select: 'grade subject totalQuestions maxScore' })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ submissions });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Retry a quiz: create a new submission after re-evaluation
 * POST /api/quizzes/:quizId/retry
 * Body: { responses: [...] }
 */
exports.retryQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { responses } = req.body;
    if (!responses) return res.status(400).json({ error: 'responses required' });

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) return res.status(404).json({ error: 'quiz not found' });

    let score = 0;
    const perQuestionScore = quiz.maxScore / quiz.totalQuestions;
    const mistakes = [];

    for (const resp of responses) {
      const q = quiz.questions.find((x) => String(x._id) === String(resp.questionId));
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

    const suggestions = await ai.getSuggestions(mistakes);

    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user._id,
      responses: responses.map((r) => ({ question: r.questionId, userResponse: r.userResponse })),
      score,
      maxScore: quiz.maxScore,
      isRetry: true
    });

    res.json({
      submissionId: submission._id,
      score,
      maxScore: quiz.maxScore,
      mistakes,
      suggestions
    });
  } catch (err) {
    console.error('Error retrying quiz:', err);
    res.status(500).json({ error: 'server error' });
  }
};
