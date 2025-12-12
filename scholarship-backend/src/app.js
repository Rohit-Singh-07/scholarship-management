require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ---- Minimal lifecycle logger (insert at the very top) ----
app.use((req, res, next) => {
  console.log('>>> REQ START:', req.method, req.path, 'headers:', {
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    ua: req.headers['user-agent'],
    auth: req.headers.authorization ? 'yes' : 'no'
  });
  // Listen for finish to log status and where it ended
  res.on('finish', () => {
    console.log('<<< RES FINISH:', req.method, req.path, 'status=', res.statusCode);
  });
  next();
});
// ----------------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(cors());

// a simple public root BEFORE any other route (you already have it; keep it)
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

app.use('/api', routes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// Rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

app.use(errorHandler);

module.exports = app;
