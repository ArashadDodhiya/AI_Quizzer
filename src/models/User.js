// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  // since mock auth accepts any credentials, we store minimal info
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
