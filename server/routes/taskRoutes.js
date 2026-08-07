import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getAllTasks, createTask, updateTask, toggleTask,
  deleteTask, purgeCompleted, exportFormatted, purgeAllTasks
} from '../controllers/taskController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getAllTasks);
router.post('/', createTask);
router.delete('/', purgeAllTasks);
router.put('/:id', updateTask);
router.patch('/:id/toggle', toggleTask);
router.delete('/completed/purge', purgeCompleted);
router.delete('/:id', deleteTask);
router.get('/export/formatted', exportFormatted);

export default router;
