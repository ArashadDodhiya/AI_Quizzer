// src/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const ai = require('../utils/aiSimulator');
const mongoose = require('mongoose');

/**
 * Generate a new quiz (AI -> simulated)
 * Body: { grade, subject, totalQuestions, maxScore, difficulty (optional) }
 */
exports.generateQuiz = async (req, res) => {
  try {
    const { grade, subject, totalQuestions = 10, maxScore = 10 } = req.body;
    if (!grade || !subject) return res.status(400).json({ error: 'grade and subject required' });

    // derive past performance for user to adapt difficulty
    const pastSubs = await Submission.find({ user: req.user._id }).populate({
      path: 'quiz',
      select: 'totalQuestions maxScore difficultyDistribution'
    });

    // compute simple rates
    const pastPerformance = { easyCorrectRate: null, mediumCorrectRate: null, hardCorrectRate: null };
    if (pastSubs.length > 0) {
      // naive calculation: average percent correct on difficulties using stored quizzes
      // For simplicity, leave null; adaptive behavior in ai.makeQuizPayload will be minimal
    }

    const payload = ai.makeQuizPayload({ grade, subject, totalQuestions, maxScore, pastPerformance });

    // Save questions to DB
    const questionDocs = [];
    for (const q of payload.questions) {
      const doc = await Question.create(q);
      questionDocs.push(doc);
    }

    const quiz = await Quiz.create({
      creator: req.user._id,
      grade,
      subject,
      totalQuestions,
      maxScore,
      difficultyDistribution: payload.difficultyDistribution,
      questions: questionDocs.map((q) => q._id)
    });

    // populate questions for response
    const populated = await Quiz.findById(quiz._id).populate('questions');

    res.json({ quiz: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Ask for a hint for a question
 * GET /api/quizzes/:quizId/hint?questionId=...
 */
exports.getHint = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionId } = req.query;
    if (!questionId) return res.status(400).json({ error: 'questionId required' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'question not found' });

    const hint = ai.generateHintForQuestion(question);
    res.json({ hint });
  } catch (err) {
    console.error(err);
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
    if (!quizId || !responses) return res.status(400).json({ error: 'quizId and responses required' });

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) return res.status(404).json({ error: 'quiz not found' });

    const evaluation = ai.evaluateSubmission(quiz, responses);

    // Save submission
    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user._id,
      responses: responses.map((r) => ({ question: r.questionId, userResponse: r.userResponse })),
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      isRetry: false
    });

    // return evaluation + suggestions
    res.json({
      submissionId: submission._id,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      mistakes: evaluation.mistakes,
      suggestions: evaluation.suggestions
    });
  } catch (err) {
    console.error(err);
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
      // find quizzes of that grade, then submissions linked to them
      const quizzes = await Quiz.find({ grade: Number(grade) }).select('_id');
      filter.quiz = { $in: quizzes.map((q) => q._id) };
    }

    if (subject) {
      const quizzes = await Quiz.find({ subject }).select('_id');
      filter.quiz = filter.quiz ? { $in: quizzes.map((q) => q._id) } : { $in: quizzes.map((q) => q._id) };
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
        // include entire day
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
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

/**
 * Retry a quiz: create a new submission after re-evaluation (or treat as a new attempt)
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

    const evaluation = ai.evaluateSubmission(quiz, responses);

    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user._id,
      responses: responses.map((r) => ({ question: r.questionId, userResponse: r.userResponse })),
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      isRetry: true
    });

    // old submissions remain accessible via history endpoint
    res.json({
      submissionId: submission._id,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      mistakes: evaluation.mistakes,
      suggestions: evaluation.suggestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
