import { MongoClient } from 'mongodb';

let client;
let dbPromise;

export function getDb() {
    if (!dbPromise) {
        client = new MongoClient(process.env.MONGODB_URI);
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

export const getStudioCollection = async () =>
    (await getDb()).collection('StudioCollection');

export const getBookingCollection = async () =>
    (await getDb()).collection('BookingCollection');