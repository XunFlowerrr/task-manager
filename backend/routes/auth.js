import express from 'express';
import { login, register } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

export default router;
