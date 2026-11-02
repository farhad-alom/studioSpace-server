import { ObjectId } from 'mongodb';
import { getStudioCollection } from '../config/db.js';
import { escapeRegex, pickStudioFields } from '../utils/helpers.js';

export async function getStudios(req, res) {
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
}

export async function getMyStudios(req, res) {
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
}

export async function getStudioById(req, res) {
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
}

export async function addStudio(req, res) {
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
}

export async function updateStudio(req, res) {
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
}

export async function deleteStudio(req, res) {
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
}