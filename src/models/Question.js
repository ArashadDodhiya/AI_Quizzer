// src/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String }], // e.g. ["A. 1", "B. 2", ...]
  correctOption: { type: String, required: true }, // option letter e.g. "A"
  grade: { type: Number },
  subject: { type: String },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' },
  hint: { type: String }, // hint text
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
