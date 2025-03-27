import { query } from '../config/database.js';
import { logger } from '../logger.js';

const log = logger('project.js');

export async function createProject(req, res) {
  log.info("createProject: Request received, body=" + JSON.stringify(req.body));
  try {
    const { projectName, projectDescription, category } = req.body;
    if (!projectName || !category) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedProjectName = projectName.trim();
    const sanitizedProjectDescription = projectDescription ? projectDescription.trim() : '';
    const sanitizedCategory = category.trim();
    const idRes = await query('SELECT generate_project_id() as id');
    log.debug("createProject: Project id generation response: " + JSON.stringify(idRes));
    const projectId = idRes.rows[0].id;
    await query(
      `INSERT INTO project (project_id, project_name, project_description, owner_id, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, sanitizedProjectName, sanitizedProjectDescription, req.user.userId, sanitizedCategory]
    );
    log.debug("createProject: Insert query complete for project " + projectId);
    log.info(`createProject: Project ${projectId} created by user ${req.user.userId}`);
    res.status(201).json({ message: 'Project created', projectId });
  } catch (error) {
    log.error("createProject error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllProjects(req, res) {
  log.info("getAllProjects: Request received");
  try {
    const result = await query(
      `SELECT p.* FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.owner_id = $1 OR pm.user_id = $1`,
      [req.user.userId]
    );
    log.debug("getAllProjects: Query result: " + JSON.stringify({ rowCount: result.rowCount }));
    log.info(`getAllProjects: Retrieved ${result.rowCount} projects for user ${req.user.userId}`);
    res.status(200).json(result.rows);
  } catch (error) {
    log.error("getAllProjects error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProject(req, res) {
  log.info("getProject: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.* FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    log.debug("getProject: Query result: " + JSON.stringify({ rowCount: result.rowCount }));
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    log.info(`getProject: Retrieved project ${id} for user ${req.user.userId}`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    log.error("getProject error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProject(req, res) {
  log.info("updateProject: Request received, id=" + req.params.id + ", body=" + JSON.stringify(req.body));
  try {
    const { id } = req.params;
    const { projectName, projectDescription, category } = req.body;
    if (!projectName || !category) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const sanitizedProjectName = projectName.trim();
    const sanitizedProjectDescription = projectDescription ? projectDescription.trim() : '';
    const sanitizedCategory = category.trim();
    const ownerCheck = await query('SELECT owner_id FROM project WHERE project_id = $1', [id]);
    log.debug("updateProject: Owner check result: " + JSON.stringify(ownerCheck));
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query(
      `UPDATE project SET project_name=$1, project_description=$2, category=$3
       WHERE project_id=$4`,
      [sanitizedProjectName, sanitizedProjectDescription, sanitizedCategory, id]
    );
    log.debug("updateProject: Update query complete for project " + id);
    log.info(`updateProject: Project ${id} updated by user ${req.user.userId}`);
    res.status(200).json({ message: 'Project updated' });
  } catch (error) {
    log.error("updateProject error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProject(req, res) {
  log.info("deleteProject: Request received, id=" + req.params.id);
  try {
    const { id } = req.params;
    const ownerCheck = await query('SELECT owner_id FROM project WHERE project_id = $1', [id]);
    log.debug("deleteProject: Owner check result: " + JSON.stringify(ownerCheck));
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query('DELETE FROM project WHERE project_id = $1', [id]);
    log.debug("deleteProject: Delete query complete for project " + id);
    log.info(`deleteProject: Project ${id} deleted by user ${req.user.userId}`);
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    log.error("deleteProject error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
