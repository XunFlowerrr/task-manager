import { query } from '../config/database.js';
import { logger } from '../logger.js';
const log = logger('projectInvitation.js');

export async function sendInvitation(req, res) {
  log.info("sendInvitation: Request received, params=" + JSON.stringify(req.params) + ", body=" + JSON.stringify(req.body));
  try {
    const { projectId } = req.params;
    let { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId.' });
    }
    userId = userId.trim();
    // Verify requester is the owner of the project
    const ownerRes = await query('SELECT owner_id FROM project WHERE project_id = $1', [projectId]);
    log.debug("sendInvitation: Owner response: " + JSON.stringify(ownerRes));
    if (!ownerRes.rows[0] || ownerRes.rows[0].owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Create invitation record
    const idRes = await query('SELECT generate_invitation_id() as id');
    log.debug("sendInvitation: Generated invitation id response: " + JSON.stringify(idRes));
    const invitationId = idRes.rows[0].id;
    await query(
      `INSERT INTO project_invitation (invitation_id, project_id, user_id, invited_by)
       VALUES ($1, $2, $3, $4)`,
      [invitationId, projectId, userId, req.user.userId]
    );
    log.debug(`sendInvitation: Invitation record inserted for id ${invitationId}`);
    log.info(`sendInvitation: Invitation ${invitationId} sent for project ${projectId} to user ${userId}`);
    res.status(201).json({ message: 'Invitation sent', invitationId });
  } catch (error) {
    log.error("sendInvitation error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acceptInvitation(req, res) {
  log.info("acceptInvitation: Request received, params=" + JSON.stringify(req.params));
  try {
    const { invitationId } = req.params;
    // Retrieve invitation
    const invRes = await query('SELECT * FROM project_invitation WHERE invitation_id = $1', [invitationId]);
    log.debug("acceptInvitation: Invitation query response: " + JSON.stringify(invRes));
    if (invRes.rowCount === 0) return res.status(404).json({ error: 'Invitation not found' });
    const invitation = invRes.rows[0];
    // Ensure the logged-in user is the one invited
    if (invitation.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Mark invitation as accepted
    await query('UPDATE project_invitation SET status = $1 WHERE invitation_id = $2', ['accepted', invitationId]);
    // Add the user to the project members
    await query('INSERT INTO project_member (project_id, user_id) VALUES ($1, $2)', [invitation.project_id, req.user.userId]);
    log.debug(`acceptInvitation: Updated invitation status and inserted project member for invitation ${invitationId}`);
    log.info(`acceptInvitation: Invitation ${invitationId} accepted and user ${req.user.userId} added to project ${invitation.project_id}`);
    res.status(200).json({ message: 'Invitation accepted; user added to project' });
  } catch (error) {
    log.error("acceptInvitation error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function declineInvitation(req, res) {
  log.info("declineInvitation: Request received, params=" + JSON.stringify(req.params));
  try {
    const { invitationId } = req.params;
    // Retrieve invitation
    const invRes = await query('SELECT * FROM project_invitation WHERE invitation_id = $1', [invitationId]);
    log.debug("declineInvitation: Invitation query response: " + JSON.stringify(invRes));
    if (invRes.rowCount === 0) return res.status(404).json({ error: 'Invitation not found' });
    const invitation = invRes.rows[0];
    // Ensure the logged-in user is the one invited
    if (invitation.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Remove the invitation record
    await query('DELETE FROM project_invitation WHERE invitation_id = $1', [invitationId]);
    log.debug(`declineInvitation: Invitation record deleted for ${invitationId}`);
    log.info(`declineInvitation: Invitation ${invitationId} declined`);
    res.status(200).json({ message: 'Invitation declined' });
  } catch (error) {
    log.error("declineInvitation error: " + error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
