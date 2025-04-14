import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { query } from "../config/database.js";
import { config } from "../config/config.js";
import { logger } from "../logger.js";
import { User } from "../interfaces/index.js";

const log = logger("auth.ts");

/**
 * User registration handler
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      res.status(400).json({
        error: "Please provide username, email, and password.",
      });
      return;
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim();
    const role = "user";

    // Check if user already exists
    const existing = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(400).json({
        error: "User with this email already exists.",
      });
      return;
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
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: "Please provide email and password.",
      });
      return;
    }

    // Sanitize email
    const sanitizedEmail = email.trim();

    // Find user by email
    const userRes = await query("SELECT * FROM users WHERE email = $1", [
      sanitizedEmail,
    ]);
    if (userRes.rowCount === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = userRes.rows[0] as User;

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password as string);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
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
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    // User info comes from the auth middleware
    const { userId } = req.user as { userId: string };

    const userRes = await query(
      "SELECT user_id, username, email, role FROM users WHERE user_id = $1",
      [userId]
    );

    if (userRes.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
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
function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret as string,
    { expiresIn: "15d" }
  );
}
