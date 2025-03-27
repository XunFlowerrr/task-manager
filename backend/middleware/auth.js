import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { logger } from "../logger.js";

const log = logger("auth-middleware");

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header or cookies
 */
export function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    // Extract token from Authorization header if present
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // Otherwise check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      next();
    } catch (jwtError) {
      log.error("JWT verification failed", jwtError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (err) {
    log.error("Auth middleware error", err);
    return res.status(500).json({ error: "Authentication error" });
  }
}
