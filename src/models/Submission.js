// src/models/Submission.js
const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  userResponse: { type: String }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responses: [responseSchema],
  score: { type: Number },
  maxScore: { type: Number },
  completedAt: { type: Date, default: Date.now },
  // keep boolean to indicate if this was a retry
  isRetry: { type: Boolean, default: false }
});

submissionSchema.index({ user: 1, quiz: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
