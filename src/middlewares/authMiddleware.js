// src/middlewares/authMiddleware.js
const jwtUtils = require('../utils/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });

    const token = parts[1];
    const decoded = jwtUtils.verify(token);
    // Basic: ensure user exists or create user record
    let user = await User.findOne({ username: decoded.username });
    if (!user) user = await User.create({ username: decoded.username });
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
