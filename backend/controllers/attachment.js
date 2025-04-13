import { query } from "../config/database.js";
import { logger } from "../logger.js";
import fs from "fs/promises"; // Use promises version of fs
import path from "path";
import { fileURLToPath } from "url";

const log = logger("attachment.js");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads"); // Go up one level from controllers

// Helper function to check project membership or ownership
async function checkProjectAccess(projectId, userId) {
  const accessCheck = await query(
    `SELECT p.project_id
         FROM project p
         LEFT JOIN project_member pm ON p.project_id = pm.project_id
         WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
    [projectId, userId]
  );
  return accessCheck.rowCount > 0;
}

// Helper function to check task access (implicitly checks project access)
async function checkTaskAccess(taskId, userId) {
  const taskCheck = await query(
    `SELECT t.task_id, t.project_id
         FROM task t
         JOIN project p ON t.project_id = p.project_id
         LEFT JOIN project_member pm ON p.project_id = pm.project_id
         WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
    [taskId, userId]
  );
  return taskCheck.rows[0]; // Returns row with task_id and project_id if access granted, else undefined
}

// Upload a new attachment (Multer middleware handles the actual file saving)
export async function uploadAttachment(req, res) {
  log.info("uploadAttachment: Request received");
  try {
    const { taskId } = req.body; // Get taskId from request body (sent by frontend)
    const userId = req.user.userId;
    const file = req.file; // File info from multer

    if (!taskId) {
      log.warn("uploadAttachment: Missing taskId");
      // Clean up uploaded file if taskId is missing
      if (file) await fs.unlink(file.path);
      return res.status(400).json({ error: "Missing required field: taskId" });
    }

    if (!file) {
      log.warn("uploadAttachment: No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify user has access to the task (and thus the project)
    const taskAccess = await checkTaskAccess(taskId, userId);
    if (!taskAccess) {
      log.warn(
        `uploadAttachment: User ${userId} not authorized for task ${taskId}`
      );
      // Clean up uploaded file
      await fs.unlink(file.path);
      return res
        .status(403)
        .json({ error: "Not authorized to add attachments to this task" });
    }

    // Generate a new attachment ID
    const newIdRes = await query("SELECT generate_attachment_id() as id");
    const attachmentId = newIdRes.rows[0].id;

    // Save attachment metadata to the database
    const result = await query(
      `INSERT INTO attachment (attachment_id, task_id, file_name, file_path, file_type, file_size)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [
        attachmentId,
        taskId,
        file.originalname,
        file.filename,
        file.mimetype,
        file.size,
      ]
    );

    const newAttachment = result.rows[0];
    log.info(
      `uploadAttachment: Attachment ${attachmentId} uploaded for task ${taskId} by user ${userId}`
    );
    res.status(201).json({
      message: "Attachment uploaded successfully",
      attachment: newAttachment,
    });
  } catch (error) {
    log.error("uploadAttachment error: " + error);
    // Clean up uploaded file in case of database error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        log.debug(
          `uploadAttachment: Cleaned up file ${req.file.filename} after error.`
        );
      } catch (unlinkError) {
        log.error(
          `uploadAttachment: Failed to clean up file ${req.file.filename}: ${unlinkError}`
        );
      }
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all attachments; if taskId provided, check membership, else retrieve attachments for allowed tasks
export async function getAllAttachments(req, res) {
  log.info(
    "getAllAttachments: Request received, query=" + JSON.stringify(req.query)
  );
  try {
    const { taskId } = req.query;
    const userId = req.user.userId;

    if (taskId) {
      // Check access to the specific task
      const taskAccess = await checkTaskAccess(taskId, userId);
      if (!taskAccess) {
        log.warn(
          `getAllAttachments: User ${userId} not authorized for task ${taskId}`
        );
        return res
          .status(403)
          .json({ error: "Not authorized to view attachments for this task" });
      }
      // Fetch attachments for the specific task (removed ORDER BY)
      const result = await query(
        "SELECT * FROM attachment WHERE task_id = $1",
        [taskId]
      );
      log.info(
        `getAllAttachments: ${result.rowCount} attachments for task ${taskId} retrieved by user ${userId}`
      );
      return res.status(200).json(result.rows);
    } else {
      // Fetch all attachments for tasks the user has access to (removed ORDER BY)
      const result = await query(
        `SELECT a.*
                 FROM attachment a
                 JOIN task t ON a.task_id = t.task_id
                 JOIN project p ON t.project_id = p.project_id
                 LEFT JOIN project_member pm ON p.project_id = pm.project_id
                 WHERE p.owner_id = $1 OR pm.user_id = $1`,
        [userId]
      );
      log.info(
        `getAllAttachments: ${result.rowCount} attachments for allowed tasks retrieved by user ${userId}`
      );
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    log.error("getAllAttachments error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Download a specific attachment
export async function downloadAttachment(req, res) {
  log.info("downloadAttachment: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Get attachment details
    const attachmentRes = await query(
      `SELECT a.*, t.project_id
             FROM attachment a
             JOIN task t ON a.task_id = t.task_id
             WHERE a.attachment_id = $1`,
      [id]
    );

    if (attachmentRes.rowCount === 0) {
      log.warn(`downloadAttachment: Attachment ${id} not found`);
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = attachmentRes.rows[0];

    // 2. Verify user has access to the project this attachment belongs to
    const hasAccess = await checkProjectAccess(attachment.project_id, userId);
    if (!hasAccess) {
      log.warn(
        `downloadAttachment: User ${userId} not authorized for project ${attachment.project_id} (attachment ${id})`
      );
      return res
        .status(403)
        .json({ error: "Not authorized to download this attachment" });
    }

    // 3. Construct file path and send for download
    const filePath = path.join(uploadsDir, attachment.file_path); // file_path stores the filename generated by multer

    // Check if file exists before attempting download
    try {
      await fs.access(filePath); // Check file existence and permissions
      log.info(
        `downloadAttachment: Sending file ${attachment.file_path} for attachment ${id}`
      );
      // Use res.download to prompt download with original filename
      res.download(filePath, attachment.file_name, (err) => {
        if (err) {
          // Handle errors that occur after headers may have been sent
          log.error(
            `downloadAttachment: Error sending file ${attachment.file_path}: ${err}`
          );
          // Avoid sending another response if headers already sent
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      });
    } catch (fileError) {
      log.error(
        `downloadAttachment: File not found or inaccessible at ${filePath} for attachment ${id}: ${fileError}`
      );
      return res
        .status(404)
        .json({ error: "Attachment file not found on server" });
    }
  } catch (error) {
    log.error("downloadAttachment error: " + error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

// Delete an attachment
export async function deleteAttachment(req, res) {
  log.info("deleteAttachment: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Get attachment details and verify ownership/membership in one query
    const attachmentCheck = await query(
      `SELECT a.attachment_id, a.file_path, t.project_id
             FROM attachment a
             JOIN task t ON a.task_id = t.task_id
             JOIN project p ON t.project_id = p.project_id
             LEFT JOIN project_member pm ON p.project_id = pm.project_id
             WHERE a.attachment_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, userId]
    );

    if (attachmentCheck.rowCount === 0) {
      log.warn(
        `deleteAttachment: Attachment ${id} not found or user ${userId} not authorized`
      );
      // Check if attachment exists at all to give a more specific error
      const exists = await query(
        "SELECT 1 FROM attachment WHERE attachment_id = $1",
        [id]
      );
      if (exists.rowCount === 0) {
        return res.status(404).json({ error: "Attachment not found" });
      } else {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this attachment" });
      }
    }

    const attachment = attachmentCheck.rows[0];
    const filePath = path.join(uploadsDir, attachment.file_path);

    // 2. Delete the file from filesystem
    try {
      await fs.unlink(filePath);
      log.debug(
        `deleteAttachment: File ${attachment.file_path} deleted from filesystem`
      );
    } catch (unlinkError) {
      // Log error but proceed to delete DB record, maybe the file was already gone
      log.error(
        `deleteAttachment: Failed to delete file ${attachment.file_path}: ${unlinkError}. Proceeding with DB deletion.`
      );
    }

    // 3. Delete the attachment record from the database
    await query("DELETE FROM attachment WHERE attachment_id = $1", [id]);

    log.info(`deleteAttachment: Attachment ${id} deleted by user ${userId}`);
    // Send 200 or 204 based on frontend expectation
    res.status(200).json({ message: "Attachment deleted successfully" });
    // Alternatively, for 204 No Content: res.status(204).send();
  } catch (error) {
    log.error("deleteAttachment error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}
