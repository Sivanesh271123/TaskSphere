import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, logout, forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 account creations per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this IP, please try again after an hour.' }
});

const isProd = process.env.NODE_ENV === 'production';

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 100, // Strict 5 in prod, generous 100 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests from this IP, please try again after 15 minutes.' }
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 100, // Strict 10 in prod, generous 100 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts from this IP, please try again later.' }
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 100, // Strict 5 in prod, generous 100 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests from this IP, please try again after 15 minutes.' }
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-reset-otp', verifyOtpLimiter, verifyResetOTP);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export default router;
