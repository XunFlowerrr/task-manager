import express from 'express';
import { sendInvitation, acceptInvitation, declineInvitation } from '../controllers/projectInvitation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/:projectId/invitations', sendInvitation);
router.put('/:invitationId/accept', acceptInvitation);
router.delete('/:invitationId/decline', declineInvitation);

export default router;
