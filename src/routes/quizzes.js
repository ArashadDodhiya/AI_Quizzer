// src/routes/quizzes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const quizController = require('../controllers/quizController');

router.post('/generate', auth, quizController.generateQuiz);
router.get('/hint/:quizId', auth, quizController.getHint);
router.post('/submit', auth, quizController.submitQuiz);
router.get('/history', auth, quizController.getHistory);
router.post('/:quizId/retry', auth, quizController.retryQuiz);

module.exports = router;
