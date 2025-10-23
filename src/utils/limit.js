const rateLimit = require("express-rate-limit");

const generateQuizLimiter = rateLimit({
  windowMs: 60 * 1000, // for one minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many quiz generations from this IP, please try again after a minute."
});

module.exports = generateQuizLimiter;