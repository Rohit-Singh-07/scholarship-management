// src/utils/emailSender.js
const nodemailer = require("nodemailer");
const retry = require("async-retry");

const isTest = process.env.NODE_ENV === "test";
const EMAIL_DISABLED =
  isTest || String(process.env.EMAIL_DISABLED || "false").toLowerCase() === "true";

let transporter = null;

function createTransporter() {
  if (transporter) return transporter;

  // ⛔ TEST MODE OR EMAIL DISABLED — SKIP REAL SMTP
  if (EMAIL_DISABLED) {
    transporter = {
      sendMail: async (opts) => {
        console.log("[emailSender] TEST MODE — skipping email:", {
          to: opts.to,
          subject: opts.subject,
        });
        return { messageId: "test-email", disabled: true };
      },
    };
    return transporter;
  }

  // ✅ REAL SMTP (Prod / Dev)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter
    .verify()
    .then(() => console.log("[emailSender] SMTP transporter verified"))
    .catch((err) =>
      console.error("[emailSender] SMTP verification failed:", err.message)
    );

  return transporter;
}

async function sendEmail(options = {}) {
  if (!options.to) throw new Error('emailSender: "to" is required');

  const transporter = createTransporter();

  const mail = {
    from: options.from || process.env.EMAIL_FROM || "no-reply@example.com",
    to: options.to,
    subject: options.subject || "(no subject)",
    text: options.text,
    html: options.html,
  };

  return await retry(
    async () => {
      const info = await transporter.sendMail(mail);
      return info;
    },
    {
      retries: EMAIL_DISABLED ? 0 : 3,
      factor: 2,
      minTimeout: 200,
      maxTimeout: 1000,
      onRetry: (err, attempt) =>
        !EMAIL_DISABLED &&
        console.warn(
          `[emailSender] Retry ${attempt} after error:`,
          err.message
        ),
    }
  );
}

module.exports = sendEmail;
