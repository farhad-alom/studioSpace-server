import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';


const app = express();

// Middleware 
app.use(cors());
app.use(express.json());


// Server
const PORT = process.env.PORT || 5000;
const client = new MongoClient(process.env.MONGODB_URI);



export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Mongodb connect for the StudioSpace");
        return client;
    } catch (err) {
        console.dir(err);
    }
}


const mongoClient = await connectToMongoDB()
const db = mongoClient.db("StudioSpace");
const studioCollection = db.collection("StudioCollection");

// Test Route
app.get('/', (req, res) => {
    res.send('this is the server output as the 5000');

});
// explore route
// app.get('/api/studios', async (req, res) => {
//     try {
//         const { category, search, limit } = req.query;
//         const query = {};
//         if (category) query.category = category;
//         if (search) {
//             query.$or = [
//                 { title: { $regex: search, $options: 'i' } },
//                 { location: { $regex: search, $options: 'i' } },
//             ];
//         }
//         const studios = await studioCollection
//             .find(query)
//             .sort({ _id: -1 })
//             .limit(Number(limit) || 0)
//             .toArray();
//         res.json(studios);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });
app.get('/api/studios', async (req, res) => {
    const studios = await studioCollection.find().sort({ _id: -1 }).toArray();
    res.json(studios);
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});