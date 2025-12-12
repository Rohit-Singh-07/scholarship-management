const request = require("supertest");
const mongoose = require("mongoose");
const redis = require("../config/redis");
const User = require("../models/User");
const db = require("../config/db");

let app;

jest.setTimeout(30000); // prevent Jest timeout for slow DB ops

describe("Authentication E2E Tests", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";

    // Connect test database
    await db.connectTest();

    // Flush redis mock
    await redis.flushall();

    // Load app AFTER db is ready
    app = require("../app");
  });

  afterEach(async () => {
    await User.deleteMany({});
    await redis.flushall();
  });

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await db.disconnect();

  if (redis && typeof redis.quit === "function") {
    await redis.quit();
  }

  jest.useFakeTimers();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});


  // -----------------------------------------------------
  // REGISTER
  // -----------------------------------------------------
  test("User can register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Rohit",
        email: "rohit@example.com",
        password: "Password123!",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/verification email sent/i);

    const user = await User.findOne({ email: "rohit@example.com" });
    expect(user).not.toBeNull();
    expect(user.emailVerified).toBe(false);
  });

  // -----------------------------------------------------
  // LOGIN BLOCKED
  // -----------------------------------------------------
  test("User cannot login until email verified", async () => {
    await User.create({
      name: "Rohit",
      email: "rohit@example.com",
      password: "Password123!",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "rohit@example.com",
        password: "Password123!",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  // -----------------------------------------------------
  // EMAIL VERIFY
  // -----------------------------------------------------
  test("Email verification works", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Rohit",
        email: "rohit@example.com",
        password: "Password123!",
      });

    await redis.set("email_verification:rohit@example.com", "123456");

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({
        email: "rohit@example.com",
        otp: "123456",
      });

    expect(res.statusCode).toBe(200);

    const user = await User.findOne({ email: "rohit@example.com" });
    expect(user.emailVerified).toBe(true);
  });

  // -----------------------------------------------------
  // LOGIN WORKS AFTER VERIFY
  // -----------------------------------------------------
  test("User can login after verification", async () => {
    await User.create({
      name: "Rohit",
      email: "rohit@example.com",
      password: "Password123!",
      emailVerified: true,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "rohit@example.com",
        password: "Password123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  // -----------------------------------------------------
  // PASSWORD RESET REQUEST
  // -----------------------------------------------------
  test("User can request password reset", async () => {
    await User.create({
      name: "Rohit",
      email: "rohit@example.com",
      password: "Password123!",
      emailVerified: true,
    });

    const res = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "rohit@example.com" });

    expect(res.statusCode).toBe(200);
  });

  // -----------------------------------------------------
  // PASSWORD RESET CONFIRM
  // -----------------------------------------------------
  test("Password reset confirm works", async () => {
    const user = await User.create({
      name: "Rohit",
      email: "rohit@example.com",
      password: "Password123!",
      emailVerified: true,
    });

    const { raw } = user.generatePasswordReset();
    await user.save();

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: "rohit@example.com",
        token: raw,
        password: "NewPass456!",
      });

    expect(res.statusCode).toBe(200);

    const updated = await User.findOne({ email: "rohit@example.com" }).select(
      "+password"
    );

    expect(await updated.comparePassword("NewPass456!")).toBe(true);
  });
});
