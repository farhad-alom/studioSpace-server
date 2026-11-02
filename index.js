import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { isProd } from './config/cookie.js';
import authRoutes from './routes/auth.routes.js';
import studioRoutes from './routes/studio.routes.js';

const app = express();

app.use(cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('StudioSpace Backend is running!');
});

app.use('/api', authRoutes);
app.use('/api', studioRoutes);

// Vercel uses this export
export default app;

// Localhost
if (!isProd) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}