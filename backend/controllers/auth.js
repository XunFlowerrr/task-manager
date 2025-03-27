import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import { config } from "../config/config.js";
import { logger } from "../logger.js";

const log = logger("auth.js");

/**
 * User registration handler
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Please provide username, email, and password.",
      });
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim();
    const role = "user";

    // Check if user already exists
    const existing = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({
        error: "User with this email already exists.",
      });
    }

    // Generate user ID and hash password
    const idRes = await query("SELECT generate_user_id() as id");
    const user_id = idRes.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await query(
      `INSERT INTO users (user_id, username, email, password, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, sanitizedUsername, sanitizedEmail, hashedPassword, role]
    );

    log.info(`User ${user_id} registered with email ${sanitizedEmail}`);

    // Return success without sensitive data
    res.status(201).json({
      success: true,
      message: "Registration successful",
      userId: user_id,
    });
  } catch (error) {
    log.error("Registration error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User login handler
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Please provide email and password.",
      });
    }

    // Sanitize email
    const sanitizedEmail = email.trim();

    // Find user by email
    const userRes = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userRes.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    log.info(`User ${user.user_id} logged in successfully`);

    // Send response
    res.status(200).json({
      success: true,
      token,
      userId: user.user_id,
      name: user.username || user.email.split("@")[0],
      email: user.email,
    });
  } catch (error) {
    log.error("Login error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(req, res) {
  try {
    // User info comes from the auth middleware
    const { userId } = req.user;

    const userRes = await query(
      "SELECT user_id, username, email, role FROM users WHERE user_id = $1",
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    res.status(200).json({
      userId: user.user_id,
      name: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    log.error("Get current user error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "15d" }
  );
}
