import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ---------- Middleware ----------
app.use(cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ---------- MongoDB ----------
const client = new MongoClient(process.env.MONGODB_URI);
let dbPromise;

function getDb() {
    if (!dbPromise) {
        dbPromise = client.connect()
            .then(() => {
                console.log('MongoDB connected successfully');
                return client.db('StudioSpace');
            })
            .catch((error) => {
                dbPromise = null;
                throw error;
            });
    }
    return dbPromise;
}

const getStudioCollection = async () => (await getDb()).collection('StudioCollection');

// ---------- Auth helpers ----------
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// JWT cookie যাচাই করে। না থাকলে বা ভুল হলে 401
function verifyToken(req, res, next) {
    const token = req.cookies?.studio_token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: please login' });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
    }
}

// Studio ফর্মের শুধু অনুমোদিত ফিল্ড নেয়
function pickStudioFields(body) {
    return {
        title: String(body.title || '').trim(),
        category: String(body.category || '').trim(),
        hourlyRate: Number(body.hourlyRate) || 0,
        securityDeposit: Number(body.securityDeposit) || 0,
        maxCapacity: Number(body.maxCapacity) || 0,
        location: String(body.location || '').trim(),
        image: String(body.image || '').trim(),
        amenities: Array.isArray(body.amenities) ? body.amenities : [],
        overview: String(body.overview || '').trim(),
    };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- Routes ----------
app.get('/', (req, res) => {
    res.send('StudioSpace Backend is running!');
});

// Better Auth session যাচাই করে JWT cookie বানায়
app.post('/api/jwt', async (req, res) => {
    try {
        const response = await fetch(`${process.env.CLIENT_URL}/api/auth/get-session`, {
            headers: { cookie: req.headers.cookie || '' },
        });
        const data = response.ok ? await response.json() : null;

        if (!data?.user?.email) {
            return res.status(401).json({ message: 'Unauthorized: no active session' });
        }

        const token = jwt.sign(
            { email: data.user.email, name: data.user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('studio_token', token, COOKIE_OPTIONS);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('JWT Error:', error);
        res.status(500).json({ message: 'Failed to create token' });
    }
});

// Logout-এ JWT cookie মুছে ফেলে
app.post('/api/jwt/clear', (req, res) => {
    res.clearCookie('studio_token', { ...COOKIE_OPTIONS, maxAge: undefined });
    res.status(200).json({ success: true });
});

// সব studio (filter: category, search, limit)
app.get('/api/studios', async (req, res) => {
    try {
        const collection = await getStudioCollection();
        const { category, search, limit } = req.query;

        const query = {};
        if (category && category !== 'All') query.category = category;
        if (search) {
            const regex = new RegExp(escapeRegex(String(search)), 'i');
            query.$or = [{ title: regex }, { location: regex }];
        }

        let cursor = collection.find(query).sort({ _id: -1 });
        const n = parseInt(limit, 10);
        if (n > 0) cursor = cursor.limit(n);

        res.status(200).json(await cursor.toArray());
    } catch (error) {
        console.error('Get Studios Error:', error);
        res.status(500).json({ message: 'Failed to fetch studios' });
    }
});

// আমার studio (My Listings)
app.get('/api/my-studios', verifyToken, async (req, res) => {
    try {
        const collection = await getStudioCollection();
        const studios = await collection
            .find({ ownerEmail: req.user.email })
            .sort({ _id: -1 })
            .toArray();
        res.status(200).json(studios);
    } catch (error) {
        console.error('My Studios Error:', error);
        res.status(500).json({ message: 'Failed to fetch your studios' });
    }
});

// একটা studio
app.get('/api/studios/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid studio ID' });
        }
        const collection = await getStudioCollection();
        const studio = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!studio) return res.status(404).json({ message: 'Studio not found' });
        res.status(200).json(studio);
    } catch (error) {
        console.error('Get Studio Error:', error);
        res.status(500).json({ message: 'Failed to fetch studio' });
    }
});

// নতুন studio যোগ
app.post('/api/studios', verifyToken, async (req, res) => {
    try {
        const data = pickStudioFields(req.body);

        if (!data.title || !data.category || !data.location || !data.image || data.hourlyRate <= 0) {
            return res.status(400).json({ message: 'Title, category, location, image and hourly rate are required' });
        }

        const collection = await getStudioCollection();
        const result = await collection.insertOne({
            ...data,
            ownerEmail: req.user.email,
            ownerName: req.user.name,
            rating: 0,
            reviews: [],
            createdAt: new Date(),
        });

        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        console.error('Add Studio Error:', error);
        res.status(500).json({ message: 'Failed to add studio' });
    }
});

// studio আপডেট (শুধু মালিক)
app.put('/api/studios/:id', verifyToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid studio ID' });
        }
        const collection = await getStudioCollection();
        const filter = { _id: new ObjectId(req.params.id) };
        const studio = await collection.findOne(filter);

        if (!studio) return res.status(404).json({ message: 'Studio not found' });
        if (studio.ownerEmail !== req.user.email) {
            return res.status(403).json({ message: 'Forbidden: you can only edit your own studio' });
        }

        await collection.updateOne(filter, {
            $set: { ...pickStudioFields(req.body), updatedAt: new Date() },
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update Studio Error:', error);
        res.status(500).json({ message: 'Failed to update studio' });
    }
});

// studio ডিলিট (শুধু মালিক)
app.delete('/api/studios/:id', verifyToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid studio ID' });
        }
        const collection = await getStudioCollection();
        const filter = { _id: new ObjectId(req.params.id) };
        const studio = await collection.findOne(filter);

        if (!studio) return res.status(404).json({ message: 'Studio not found' });
        if (studio.ownerEmail !== req.user.email) {
            return res.status(403).json({ message: 'Forbidden: you can only delete your own studio' });
        }

        await collection.deleteOne(filter);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete Studio Error:', error);
        res.status(500).json({ message: 'Failed to delete studio' });
    }
});

// Vercel uses this export
export default app;

// Localhost
if (!isProd) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}