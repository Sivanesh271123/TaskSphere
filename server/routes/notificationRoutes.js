import { Router } from 'express';
import { 
  getNotifications, 
  getUnreadCount,
  createNotification, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  sendTestEmailController
} from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/test-email', sendTestEmailController);

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/', createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
