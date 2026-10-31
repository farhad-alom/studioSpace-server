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


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});