// src/controllers/leaderboardController.js
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

exports.getLeaderboard = async (req, res) => {
  try {
    const { grade, subject, limit = 10 } = req.query;
    // join submissions -> quiz -> filter grade/subject -> sort by score desc
    const match = {};
    if (grade) match['quiz.grade'] = Number(grade);
    if (subject) match['quiz.subject'] = subject;

    const pipeline = [
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      { $match: match },
      {
        $group: {
          _id: '$user',
          bestScore: { $max: '$score' },
          quizId: { $first: '$quiz._id' }
        }
      },
      { $sort: { bestScore: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          bestScore: 1,
          quizId: 1
        }
      }
    ];

    const result = await Submission.aggregate(pipeline);
    res.json({ leaderboard: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
