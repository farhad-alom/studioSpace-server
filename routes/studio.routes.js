import { Router } from "express";
import { authMiddleware } from "../config/auth.js";
import {
    addStudio,
    deleteStudio,
    getMyStudios,
    getStudioById,
    getStudios,
    updateStudio,
} from "../controllers/studio.controller.js";

const router = Router();

router.get("/studios", getStudios);
router.get("/my-studios", authMiddleware, getMyStudios);
router.get("/studios/:id", getStudioById);
router.post("/studios", authMiddleware, addStudio);
router.put("/studios/:id", authMiddleware, updateStudio);
router.delete("/studios/:id", authMiddleware, deleteStudio);

export default router;
