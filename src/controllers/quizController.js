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
    const questionsData = await ai.generateQuiz({ grade, subject, totalQuestions, difficulty });
    if (!questionsData || questionsData.length === 0) {
      return res.status(500).json({ error: 'AI failed to generate quiz questions' });
    }

    // First create the Quiz document
    const quiz = await Quiz.create({
      creator: req.user._id,
      grade,
      subject,
      totalQuestions,
      maxScore,
      difficultyDistribution: { easy: 0, medium: totalQuestions, hard: 0 }, // default
      questions: [] // will update after creating questions
    });

    // Assign quiz ID to each question
    const questionDocs = await Question.insertMany(
      questionsData.map((q) => ({ ...q, quiz: quiz._id }))
    );

    // Update quiz with question IDs
    quiz.questions = questionDocs.map((q) => q._id);
    await quiz.save();

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
    if (!quizId || !responses || !Array.isArray(responses)) {
      return res
        .status(400)
        .json({ error: "quizId and valid responses array required" });
    }

    // 1️⃣ Fetch quiz
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const perQuestionScore = quiz.maxScore / quiz.totalQuestions;
    let score = 0;
    const mistakes = [];

    // 2️⃣ Mapping for A/B/C/D → option values
    const optionMap = ["A", "B", "C", "D"];

    for (const resp of responses) {
      const question = quiz.questions.find(
        (q) => String(q._id) === String(resp.questionId)
      );
      if (!question) continue;

      let userAnswer = resp.userResponse;

      // Convert A/B/C/D to actual option text
      if (optionMap.includes(userAnswer)) {
        const index = optionMap.indexOf(userAnswer);
        userAnswer = question.options[index];
      }

      // Compare with correct answer
      if (userAnswer === question.correctOption) {
        score += perQuestionScore;
      } else {
        mistakes.push({
          questionId: question._id,
          text: question.text,
          correctOption: question.correctOption,
          userResponse: userAnswer,
        });
      }
    }

    // 3️⃣ Get AI suggestions (optional)
    let suggestions = [];
    if (mistakes.length > 0 && ai?.getSuggestions) {
      suggestions = await ai.getSuggestions(mistakes);
    }

    // 4️⃣ Save submission
    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user?._id || null, // if user is logged in via JWT middleware
      responses: responses.map((r) => ({
        question: r.questionId,
        userResponse: r.userResponse,
      })),
      score,
      maxScore: quiz.maxScore,
      isRetry: false,

      
    });

    // 5️⃣ Send response
    res.status(200).json({
      message: "Quiz submitted successfully",
      submissionId: submission._id,
      totalQuestions: quiz.totalQuestions,
      score,
      maxScore: quiz.maxScore,
      correctAnswers: quiz.totalQuestions - mistakes.length,
      mistakes,
      suggestions,
    });
  } catch (err) {
    console.error("Error submitting quiz:", err);
    res.status(500).json({ error: "Server error" });
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
exports.retryQuiz = async (req, res) => { // resubmit logic
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




// exports.retryQuiz = async (req, res) => { // retry logic
//   const { quizId } = req.params;
//   const old = await Quiz.findById(quizId).lean();
//   if (!old) return res.status(404).send('Quiz not found');
//   const copy = await Quiz.create({
//     title: old.title,
//     questions: old.questions,
//     duration: old.duration,
//     startedAt: Date.now()
//   });
//   res.json({ newQuizId: copy._id, expiresAt: Date.now() + copy.duration*1000 });
// };