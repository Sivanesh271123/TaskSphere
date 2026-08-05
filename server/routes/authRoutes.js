import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, logout } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export default router;
