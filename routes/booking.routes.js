import { Router } from "express";
import { authMiddleware } from "../config/auth.js";
import { addBooking, getMyBookings, cancelBooking } from "../controllers/booking.controller.js";

const router = Router();

router.post("/bookings", authMiddleware, addBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.patch("/bookings/:id/cancel", authMiddleware, cancelBooking);

export default router;
