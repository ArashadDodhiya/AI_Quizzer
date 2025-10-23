// src/routes/quizzes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const quizController = require("../controllers/quizController");
const role = require("../middlewares/roleMiddleware");
const generateQuizLimiter = require("../utils/limit");

router.post(
  "/generate",
  auth,
  role("teacher"),
  generateQuizLimiter,
  quizController.generateQuiz
);
router.get("/:quizId/hint", auth, quizController.getHint);
router.post("/submit", auth, quizController.submitQuiz);
router.get("/history", auth, quizController.getHistory);
router.post("/:quizId/retry", auth, quizController.retryQuiz);

module.exports = router;
