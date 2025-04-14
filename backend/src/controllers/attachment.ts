import { Request, Response } from "express";
import { query } from "../config/database.js";
import { logger } from "../logger.js";
import { Attachment } from "../interfaces/index.js";

const log = logger("attachment.ts");

// Helper function to check project membership or ownership
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const accessCheck = await query(
    `SELECT p.project_id
     FROM project p
     LEFT JOIN project_member pm ON p.project_id = pm.project_id
     WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
    [projectId, userId]
  );
  return accessCheck.rowCount !== null && accessCheck.rowCount > 0;
}

// Helper function to check task access (implicitly checks project access)
async function checkTaskAccess(taskId: string, userId: string): Promise<any> {
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

// Save attachment metadata to the database after UploadThing upload
export async function saveAttachmentMetadata(req: Request, res: Response): Promise<void> {
  log.info("saveAttachmentMetadata: Request received");
  log.debug("saveAttachmentMetadata: Request body:", req.body); // Log incoming body
  try {
    const { taskId, fileUrl, fileName, fileType, fileSize } = req.body;
    const userId = req.user!.userId;

    if (!taskId || !fileUrl || !fileName) {
      log.warn("saveAttachmentMetadata: Missing required fields", { taskId, fileUrl, fileName });
      res.status(400).json({ error: "Missing required fields (taskId, fileUrl, fileName)" });
      return;
    }

    // Verify user has access to the task (and thus the project)
    const taskAccess = await checkTaskAccess(taskId, userId);
    if (!taskAccess) {
      log.warn(`saveAttachmentMetadata: User ${userId} not authorized for task ${taskId}`);
      res.status(403).json({ error: "Not authorized to add attachments to this task" });
      return;
    }

    // Generate a new attachment ID
    const newIdRes = await query("SELECT generate_attachment_id() as id");
    const attachmentId = newIdRes.rows[0].id;
    log.debug(`saveAttachmentMetadata: Generated attachment ID: ${attachmentId}`); // Log generated ID

    // Prepare data for insertion
    const insertData = [
      attachmentId,
      taskId,
      fileName,
      fileUrl, // Store the UploadThing URL instead of local path
      fileType || 'application/octet-stream',
      fileSize || 0,
    ];
    log.debug("saveAttachmentMetadata: Inserting data:", insertData); // Log data before insertion

    // Save attachment metadata to the database
    const result = await query(
      `INSERT INTO attachment (attachment_id, task_id, file_name, file_path, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      insertData
    );

    const newAttachment = result.rows[0];
    log.debug("saveAttachmentMetadata: Insertion result:", newAttachment); // Log insertion result
    log.info(`saveAttachmentMetadata: Attachment ${attachmentId} metadata saved for task ${taskId} by user ${userId}`);
    res.status(201).json({
      message: "Attachment metadata saved successfully",
      attachment: newAttachment,
    });
  } catch (error) {
    log.error("saveAttachmentMetadata error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all attachments; if taskId provided, check membership, else retrieve attachments for allowed tasks
export async function getAllAttachments(req: Request, res: Response): Promise<void> {
  log.info("getAllAttachments: Request received, query=" + JSON.stringify(req.query));
  try {
    const { taskId } = req.query;
    const userId = req.user!.userId;

    if (taskId) {
      // Check access to the specific task
      const taskAccess = await checkTaskAccess(taskId as string, userId);
      if (!taskAccess) {
        log.warn(`getAllAttachments: User ${userId} not authorized for task ${taskId}`);
        res.status(403).json({ error: "Not authorized to view attachments for this task" });
        return;
      }
      // Fetch attachments for the specific task
      const result = await query(
        "SELECT * FROM attachment WHERE task_id = $1",
        [taskId]
      );
      log.info(`getAllAttachments: ${result.rowCount} attachments for task ${taskId} retrieved by user ${userId}`);
      res.status(200).json(result.rows);
      return;
    } else {
      // Fetch all attachments for tasks the user has access to
      const result = await query(
        `SELECT a.*
         FROM attachment a
         JOIN task t ON a.task_id = t.task_id
         JOIN project p ON t.project_id = p.project_id
         LEFT JOIN project_member pm ON p.project_id = pm.project_id
         WHERE p.owner_id = $1 OR pm.user_id = $1`,
        [userId]
      );
      log.info(`getAllAttachments: ${result.rowCount} attachments for allowed tasks retrieved by user ${userId}`);
      res.status(200).json(result.rows);
      return;
    }
  } catch (error) {
    log.error("getAllAttachments error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Download a specific attachment (redirects to UploadThing URL)
export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  log.info("downloadAttachment: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get attachment details
    const attachmentRes = await query(
      `SELECT a.*, t.project_id
       FROM attachment a
       JOIN task t ON a.task_id = t.task_id
       WHERE a.attachment_id = $1`,
      [id]
    );

    if (attachmentRes.rowCount === 0) {
      log.warn(`downloadAttachment: Attachment ${id} not found`);
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    const attachment = attachmentRes.rows[0];

    // Verify user has access to the project this attachment belongs to
    const hasAccess = await checkProjectAccess(attachment.project_id, userId);
    if (!hasAccess) {
      log.warn(`downloadAttachment: User ${userId} not authorized for project ${attachment.project_id} (attachment ${id})`);
      res.status(403).json({ error: "Not authorized to download this attachment" });
      return;
    }

    log.info(`downloadAttachment: Redirecting to file URL for attachment ${id}: ${attachment.file_path}`);

    // For UploadThing, we simply redirect to the file URL
    res.redirect(attachment.file_path);
  } catch (error) {
    log.error("downloadAttachment error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete an attachment (removes database record, actual file deletion is handled by UploadThing)
export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  log.info("deleteAttachment: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get attachment details and verify ownership/membership in one query
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
      log.warn(`deleteAttachment: Attachment ${id} not found or user ${userId} not authorized`);
      // Check if attachment exists at all to give a more specific error
      const exists = await query(
        "SELECT 1 FROM attachment WHERE attachment_id = $1",
        [id]
      );
      if (exists.rowCount === 0) {
        res.status(404).json({ error: "Attachment not found" });
        return;
      } else {
        res.status(403).json({ error: "Not authorized to delete this attachment" });
        return;
      }
    }

    // With UploadThing, we don't need to manually delete the file
    // They have their own lifecycle management for files

    // Delete the attachment record from the database
    await query("DELETE FROM attachment WHERE attachment_id = $1", [id]);

    log.info(`deleteAttachment: Attachment ${id} deleted by user ${userId}`);
    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    log.error("deleteAttachment error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}
