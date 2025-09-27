// src/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const leaderboardController = require('../controllers/leaderboardController');

router.get('/', auth, leaderboardController.getLeaderboard);

module.exports = router;
