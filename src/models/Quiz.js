// src/models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  grade: { type: Number, required: true },
  subject: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  difficultyDistribution: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
});

module.exports = mongoose.model('Quiz', quizSchema);
