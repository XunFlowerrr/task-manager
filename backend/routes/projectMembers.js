import express from "express";
import {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
} from "../controllers/projectMember.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:projectId/members", addProjectMember);
router.get("/:projectId/members", getProjectMembers);
router.delete("/:projectId/members/:userId", removeProjectMember);

export default router;
