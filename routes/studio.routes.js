import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    addStudio,
    deleteStudio,
    getMyStudios,
    getStudioById,
    getStudios,
    updateStudio,
} from '../controllers/studio.controller.js';

const router = Router();

router.get('/studios', getStudios);
router.get('/my-studios', verifyToken, getMyStudios);
router.get('/studios/:id', getStudioById);
router.post('/studios', verifyToken, addStudio);
router.put('/studios/:id', verifyToken, updateStudio);
router.delete('/studios/:id', verifyToken, deleteStudio);

export default router;