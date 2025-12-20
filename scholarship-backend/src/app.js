require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("./config/cors");
const rateLimit = require("express-rate-limit");
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const storage = require('./utils/storage');

const app = express();

// ---- Minimal lifecycle logger ----
app.use((req, res, next) => {
  console.log('>>> REQ START:', req.method, req.path, 'headers:', {
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    ua: req.headers['user-agent'],
    auth: req.headers.authorization ? 'yes' : 'no'
  });
  res.on('finish', () => {
    console.log('<<< RES FINISH:', req.method, req.path, 'status=', res.statusCode);
  });
  next();
});

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(cors);

// Public folder (only mount ONCE)
app.use('/uploads', express.static(storage.UPLOAD_DIR));

// Public root
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

// Rate Limiting (must be BEFORE routes)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

// Routes
app.use('/api', routes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
