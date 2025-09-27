// src/controllers/authController.js
const jwtUtils = require('../utils/jwt');
const User = require('../models/User');

/**
 * Mock login that accepts any username/password and returns a signed JWT.
 * We create or find the user in DB.
 */
exports.login = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    let user = await User.findOne({ username });
    if (!user) user = await User.create({ username });

    const token = jwtUtils.sign({ username: user.username, userId: user._id });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
