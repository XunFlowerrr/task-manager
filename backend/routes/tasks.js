import express from "express";
import {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  assignUser,
  unassignUser,
  getTaskAssignees,
  getUserTasks,
} from "../controllers/tasks.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllTasks);
router.get("/me", getUserTasks);
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Task assignee routes
router.get("/:taskId/assignees", getTaskAssignees);
router.post("/:taskId/assignees", assignUser);
router.delete("/:taskId/assignees/:userId", unassignUser);

export default router;
