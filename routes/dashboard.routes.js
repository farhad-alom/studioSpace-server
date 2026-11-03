import { Router } from 'express';
import { authMiddleware } from '../config/auth.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard/stats', authMiddleware, getDashboardStats);

export default router;
