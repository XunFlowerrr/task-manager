import express, { Router } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import {
  uploadAttachment,
  getAllAttachments,
  downloadAttachment,
  deleteAttachment,
} from "../controllers/attachment.js";
import { fileURLToPath } from "url";

const router: Router = express.Router();

// Configure Multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "..", "uploads"); // Adjust path for src directory structure

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files to the uploads directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Example: Limit file size to 10MB
});

// Apply auth middleware to all attachment routes
router.use(authMiddleware);

// Routes
router.get("/", getAllAttachments); // Get attachments (all user's or for specific task via query param ?taskId=...)
router.post("/", upload.single("file"), uploadAttachment); // Upload a new attachment (expects form-data with 'file' field and 'taskId' field)
router.get("/:id/download", downloadAttachment); // Download a specific attachment
router.delete("/:id", deleteAttachment); // Delete a specific attachment

export default router;
