import { Router } from 'express';
import { clearJwt, createJwt } from '../controllers/auth.controller.js';

const router = Router();

router.post('/jwt', createJwt);
router.post('/jwt/clear', clearJwt);

export default router;