import express from "express";
import { login, register } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

import { logger } from "../logger.js";
const log = logger("auth.js");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, (req, res) => {
  log.info("User fetched:", req.user);
  res.json(req.user);
});

export default router;
