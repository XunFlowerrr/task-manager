import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import { config } from "../config/config.js";
import { logger } from "../logger.js";

const log = logger("auth.js");

export async function register(req, res) {
  log.info(
    "register: Request received, body=" +
      JSON.stringify({ username: req.body.username, email: req.body.email })
  );
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username, email, and password." });
    }
    // New sanitization
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim();
    // Assign default role
    const role = "user";
    // Check if user already exists
    const existing = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists." });
    }
    // Generate a new user_id via stored function
    const idRes = await query("SELECT generate_user_id() as id");
    const user_id = idRes.rows[0].id;
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert new user
    await query(
      `INSERT INTO users (user_id, username, email, password, role)
             VALUES ($1, $2, $3, $4, $5)`,
      [user_id, sanitizedUsername, sanitizedEmail, hashedPassword, role]
    );
    log.info(
      `register: User ${user_id} registered with email ${sanitizedEmail}`
    );
    res
      .status(201)
      .json({ message: "User registered successfully", userId: user_id });
  } catch (error) {
    log.error("register error: " + error);
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function login(req, res) {
  log.info("login: Request received, body email=" + req.body.email);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password." });
    }
    // New sanitization
    const sanitizedEmail = email.trim();
    // Look up the user
    const userRes = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const user = userRes.rows[0];
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    // Generate JWT token
    log.info(`login: User ${user.user_id} logged in successfully`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    log.error("login error: " + error);
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function sendTokenResponse(user, statusCode, res) {
  const token = jwt.sign(
    { userId: user.user_id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "15d" }
  );

  const options = {
    httpOnly: true,
    secure: false, // default to false
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  };

  if (config.nodeENV === "production") {
    options.secure = true;
  }

  // Return token in both cookie and response body for frontend compatibility
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      message: "Login successful",
      token,
      userId: user.user_id,
      name: user.username || user.email,
      email: user.email,
    });
}
