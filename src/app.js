// src/app.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ ok: true, service: 'AI Quizzer' }));

app.use('/api/auth', authRoutes);


// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;
