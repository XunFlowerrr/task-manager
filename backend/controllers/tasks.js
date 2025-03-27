import { query } from '../config/database.js';
import { logger } from '../logger.js';
const log = logger('tasks.js');

export async function createTask(req, res) {
  log.info("createTask: Request received, body=" + JSON.stringify(req.body));
  try {
    const { projectId, taskName, taskDescription, startDate, dueDate, status, priority } = req.body;
    if (!projectId || !taskName) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedProjectId = projectId.trim();
    const sanitizedTaskName = taskName.trim();
    const sanitizedTaskDescription = taskDescription ? taskDescription.trim() : '';
    const sanitizedStatus = status ? status.trim() : 'pending';
    const membershipCheck = await query(
      `SELECT p.project_id
       FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [sanitizedProjectId, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) return res.status(403).json({ error: 'Not authorized' });

    const newId = await query('SELECT generate_task_id() as id');
    const taskId = newId.rows[0].id;
    await query(
      `INSERT INTO task (task_id, project_id, task_name, task_description, start_date, due_date, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [taskId, sanitizedProjectId, sanitizedTaskName, sanitizedTaskDescription, startDate, dueDate, sanitizedStatus, priority]
    );
    log.info(`createTask: Task ${taskId} created in project ${sanitizedProjectId}`);
    res.status(201).json({ message: 'Task created', taskId });
  } catch (error) {
    log.error("createTask error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllTasks(req, res) {
  log.info("getAllTasks: Request received, query=" + JSON.stringify(req.query));
  try {
    const { projectId } = req.query;
    const membershipCheck = await query(
      `SELECT p.project_id
       FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [projectId, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) return res.status(403).json({ error: 'Not authorized' });

    const result = await query('SELECT * FROM task WHERE project_id = $1', [projectId]);
    log.info(`getAllTasks: Retrieved ${result.rowCount} tasks for project ${projectId}`);
    res.status(200).json(result.rows);
  } catch (error) {
    log.error("getAllTasks error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTask(req, res) {
  log.info("getTask: Request received, params=" + JSON.stringify(req.params));
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT t.*
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found or not authorized' });
    log.info(`getTask: Retrieved task ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    log.error("getTask error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTask(req, res) {
  log.info("updateTask: Request received, params=" + JSON.stringify(req.params) + ", body=" + JSON.stringify(req.body));
  try {
    const { id } = req.params;
    const { taskName, taskDescription, startDate, dueDate, status, priority } = req.body;
    if (!taskName) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedTaskName = taskName.trim();
    const sanitizedTaskDescription = taskDescription ? taskDescription.trim() : '';
    const sanitizedStatus = status ? status.trim() : 'pending';
    const membershipCheck = await query(
      `SELECT t.*
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) return res.status(403).json({ error: 'Not authorized' });

    await query(
      `UPDATE task SET task_name=$1, task_description=$2, start_date=$3, due_date=$4, status=$5, priority=$6
       WHERE task_id=$7`,
      [sanitizedTaskName, sanitizedTaskDescription, startDate, dueDate, sanitizedStatus, priority, id]
    );
    log.info(`updateTask: Task ${id} updated`);
    res.status(200).json({ message: 'Task updated' });
  } catch (error) {
    log.error("updateTask error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTask(req, res) {
  log.info("deleteTask: Request received, params=" + JSON.stringify(req.params));
  try {
    const { id } = req.params;
    const membershipCheck = await query(
      `SELECT t.*
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0) return res.status(403).json({ error: 'Not authorized' });

    await query('DELETE FROM task WHERE task_id = $1', [id]);
    log.info(`deleteTask: Task ${id} deleted`);
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    log.error("deleteTask error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
