import { query } from '../config/database.js';
import { logger } from '../logger.js';
const log = logger('projectMember.js');

export async function addProjectMember(req, res) {
  log.info("addProjectMember: Request received, params=" + JSON.stringify(req.params) + ", body=" + JSON.stringify(req.body));
  try {
    const { projectId } = req.params;
    let { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId.' });
    }
    userId = userId.trim();
    // Verify requester is the owner
    const ownerRes = await query('SELECT owner_id FROM project WHERE project_id = $1', [projectId]);
    log.debug("addProjectMember: Owner response: " + JSON.stringify(ownerRes));
    if (!ownerRes.rows[0] || ownerRes.rows[0].owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Add user to project_member
    await query('INSERT INTO project_member (project_id, user_id) VALUES ($1, $2)', [projectId, userId]);
    log.debug(`addProjectMember: Project member insertion complete for project ${projectId}`);
    log.info(`addProjectMember: Member ${userId} added to project ${projectId}`);
    res.status(201).json({ message: 'User added to project' });
  } catch (error) {
    log.error("addProjectMember error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeProjectMember(req, res) {
  log.info("removeProjectMember: Request received, params=" + JSON.stringify(req.params));
  try {
    const { projectId, userId } = req.params;
    // Verify requester is the owner
    const ownerRes = await query('SELECT owner_id FROM project WHERE project_id = $1', [projectId]);
    log.debug("removeProjectMember: Owner response: " + JSON.stringify(ownerRes));
    if (!ownerRes.rows[0] || ownerRes.rows[0].owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Remove user from project_member
    await query('DELETE FROM project_member WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
    log.debug(`removeProjectMember: Deletion query complete for user ${userId} and project ${projectId}`);
    log.info(`removeProjectMember: Member ${userId} removed from project ${projectId}`);
    res.status(200).json({ message: 'User removed from project' });
  } catch (error) {
    log.error("removeProjectMember error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
