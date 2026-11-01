
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

let dbPromise;

async function getStudioCollection() {
    if (!dbPromise) {
        dbPromise = client.connect()
            .then(() => {
                console.log('MongoDB connected successfully');

                return client
                    .db('StudioSpace')
                    .collection('StudioCollection');
            })
            .catch((error) => {
                dbPromise = null;
                throw error;
            });
    }

    return dbPromise;
}

// Test Route
app.get('/', (req, res) => {
    res.send('StudioSpace Backend is running!');
});

// Get all studios
app.get('/api/studios', async (req, res) => {
    try {
        const collection = await getStudioCollection();

        const studios = await collection
            .find()
            .sort({ _id: -1 })
            .toArray();

        res.status(200).json(studios);
    } catch (error) {
        console.error('Get Studios Error:', error);
        res.status(500).json({ message: 'Failed to fetch studios' });
    }
});

// Get studio by ID
app.get('/api/studios/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid studio ID' });
        }

        const collection = await getStudioCollection();

        const studio = await collection.findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!studio) {
            return res.status(404).json({ message: 'Studio not found' });
        }

        res.status(200).json(studio);
    } catch (error) {
        console.error('Get Studio Error:', error);
        res.status(500).json({ message: 'Failed to fetch studio' });
    }
});

// Vercel uses this export
export default app;

// Localhost uses app.listen()
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
