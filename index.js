import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { isProd } from "./config/cookie.js";
import { auth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";
import studioRoutes from "./routes/studio.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const app = express();

app.use(cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const authHandler = toNodeHandler(auth);

app.use("/api/auth", authHandler);

app.get("/", (req, res) => {
    res.send("StudioSpace Backend is running!");
});

app.use("/api", studioRoutes);
app.use("/api", bookingRoutes);

// Vercel uses this export
export default app;

// Localhost
if (!isProd) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
