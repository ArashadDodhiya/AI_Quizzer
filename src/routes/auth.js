// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { body } = require('express-validator');

router.post('/login', [body('username').notEmpty()], login);

module.exports = router;
