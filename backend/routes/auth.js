import express from "express";
import { login, register, getCurrentUser } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

import { logger } from "../logger.js";
const log = logger("auth.js");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
