// src/controllers/authController.js
const jwtUtils = require('../utils/jwt');
const User = require('../models/User');

/**
 * Mock login that accepts any username/password and returns a signed JWT.
 * JWT is stored in a secure HTTP-only cookie.
 */
exports.login = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    let user = await User.findOne({ username });
    if (!user) user = await User.create({ username });

    const token = jwtUtils.sign({ username: user.username, userId: user._id });

    // Send token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only send over HTTPS in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: "Login successful", user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
