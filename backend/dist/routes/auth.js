import express from "express";
import { login, register, getCurrentUser } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../logger.js";
const router = express.Router();
const log = logger("auth.ts");
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
export default router;
//# sourceMappingURL=auth.js.map