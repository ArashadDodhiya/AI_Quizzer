// src/middlewares/authMiddleware.js
const jwtUtils = require('../utils/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    let token;

    // First check Authorization header
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }

    // Fallback to cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ error: 'Missing Authorization or cookie token' });

    const decoded = jwtUtils.verify(token);

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
