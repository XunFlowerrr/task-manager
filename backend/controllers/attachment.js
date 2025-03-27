import { query } from '../config/database.js';
import { logger } from '../logger.js';
const log = logger('attachment.js');

// Create attachment - checking user membership via task
export async function createAttachment(req, res) {
  log.info("createAttachment: Request received, body=" + JSON.stringify(req.body));
  try {
    // New input validation and sanitization
    const { attachmentName, taskId, file_url, file_type } = req.body;
    if (!attachmentName || !taskId || !file_url || !file_type) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedAttachmentName = attachmentName.trim();
    const sanitizedTaskId = taskId.trim();
    const sanitizedFile_url = file_url.trim();
    const sanitizedFile_type = file_type.trim();
    // Verify user membership in the task's project
    const membershipCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [sanitizedTaskId, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Not authorized to add attachment to this task' });
    }
    const newIdRes = await query('SELECT generate_attachment_id() as id');
    const attachmentId = newIdRes.rows[0].id;
    await query(
      `INSERT INTO attachment (attachment_id, attachment_name, task_id, file_url, file_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [attachmentId, sanitizedAttachmentName, sanitizedTaskId, sanitizedFile_url, sanitizedFile_type]
    );
    log.info(`createAttachment: Attachment ${attachmentId} created on task ${sanitizedTaskId}`);
    res.status(201).json({ message: 'Attachment created', attachmentId });
  } catch (error) {
    log.error("createAttachment error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get a single attachment with membership check
export async function getAttachment(req, res) {
  log.info("getAttachment: Request received, params=" + JSON.stringify(req.params));
  try {
    const { id } = req.params;
    const attachmentRes = await query('SELECT * FROM attachment WHERE attachment_id = $1', [id]);
    if (attachmentRes.rowCount === 0) return res.status(404).json({ error: 'Attachment not found' });
    const attachment = attachmentRes.rows[0];
    // Verify user membership via the task on which the attachment is attached
    const membershipCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [attachment.task_id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Not authorized to view this attachment' });
    }
    log.info(`getAttachment: Attachment ${id} retrieved`);
    res.status(200).json(attachment);
  } catch (error) {
    log.error("getAttachment error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all attachments; if taskId provided, check membership, else retrieve attachments for allowed tasks
export async function getAllAttachments(req, res) {
  log.info("getAllAttachments: Request received, query=" + JSON.stringify(req.query));
  try {
    const { taskId } = req.query;
    if (taskId) {
      const membershipCheck = await query(
        `SELECT t.task_id
         FROM task t
         JOIN project p ON t.project_id = p.project_id
         LEFT JOIN project_member pm ON p.project_id = pm.project_id
         WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
        [taskId, req.user.userId]
      );
      if (membershipCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Not authorized to view attachments for this task' });
      }
      const result = await query('SELECT * FROM attachment WHERE task_id = $1', [taskId]);
      log.info(`getAllAttachments: Attachments for task ${taskId} retrieved`);
      return res.status(200).json(result.rows);
    } else {
      const result = await query(
        `SELECT a.*
         FROM attachment a
         JOIN task t ON a.task_id = t.task_id
         JOIN project p ON t.project_id = p.project_id
         LEFT JOIN project_member pm ON p.project_id = pm.project_id
         WHERE p.owner_id = $1 OR pm.user_id = $1`,
        [req.user.userId]
      );
      log.info("getAllAttachments: Attachments for allowed tasks retrieved");
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    log.error("getAllAttachments error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update attachment with membership check
export async function updateAttachment(req, res) {
  log.info("updateAttachment: Request received, params=" + JSON.stringify(req.params) + ", body=" + JSON.stringify(req.body));
  try {
    const { id } = req.params;
    // New input validation and sanitization
    const { attachmentName, file_url, file_type } = req.body;
    if (!attachmentName || !file_url || !file_type) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedAttachmentName = attachmentName.trim();
    const sanitizedFile_url = file_url.trim();
    const sanitizedFile_type = file_type.trim();
    const attachmentRes = await query('SELECT * FROM attachment WHERE attachment_id = $1', [id]);
    if (attachmentRes.rowCount === 0) return res.status(404).json({ error: 'Attachment not found' });
    const attachment = attachmentRes.rows[0];
    const membershipCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [attachment.task_id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Not authorized to update this attachment' });
    }
    await query(
      `UPDATE attachment SET attachment_name = $1, file_url = $2, file_type = $3
       WHERE attachment_id = $4`,
      [sanitizedAttachmentName, sanitizedFile_url, sanitizedFile_type, id]
    );
    log.info(`updateAttachment: Attachment ${id} updated`);
    res.status(200).json({ message: 'Attachment updated' });
  } catch (error) {
    log.error("updateAttachment error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete attachment with membership check
export async function deleteAttachment(req, res) {
  log.info("deleteAttachment: Request received, params=" + JSON.stringify(req.params));
  try {
    const { id } = req.params;
    const attachmentRes = await query('SELECT * FROM attachment WHERE attachment_id = $1', [id]);
    if (attachmentRes.rowCount === 0) return res.status(404).json({ error: 'Attachment not found' });
    const attachment = attachmentRes.rows[0];
    const membershipCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [attachment.task_id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }
    await query('DELETE FROM attachment WHERE attachment_id = $1', [id]);
    log.info(`deleteAttachment: Attachment ${id} deleted`);
    res.status(200).json({ message: 'Attachment deleted' });
  } catch (error) {
    log.error("deleteAttachment error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
