import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { config } from "../config/config.js";
import { logger } from "../logger.js";

const log = logger("auth-middleware");

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header or cookies
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token: string | null = null;

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
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, config.jwtSecret as string) as jwt.JwtPayload;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      next();
    } catch (jwtError) {
      log.error("JWT verification failed", jwtError);
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
  } catch (err) {
    log.error("Auth middleware error", err);
    res.status(500).json({ error: "Authentication error" });
    return;
  }
}
