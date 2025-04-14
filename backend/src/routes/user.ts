import express, { Router } from "express";
import { searchUsers } from "../controllers/user.js";
import { authMiddleware } from "../middleware/auth.js";

const router: Router = express.Router();

// Protect routes with authentication middleware
router.use(authMiddleware);

// Route for searching users
router.get("/search", searchUsers);

// Add other user-related routes if needed

export default router;
