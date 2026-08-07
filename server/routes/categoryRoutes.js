import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getCategories, createCategory } from '../controllers/categoryController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', createCategory);

export default router;
