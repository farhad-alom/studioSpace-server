import { ObjectId } from 'mongodb';
import { getBookingCollection, getStudioCollection } from '../config/db.js';

const toMinutes = (t) => {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
};

export async function addBooking(req, res) {
    try {
        const { studioId, date, startTime, endTime } = req.body;

        if (!ObjectId.isValid(studioId) || !date || !startTime || !endTime) {
            return res.status(400).json({ message: 'Studio, date, start and end time are required' });
        }
        const hours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
        if (!(hours > 0)) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        const studio = await (await getStudioCollection()).findOne({ _id: new ObjectId(studioId) });
        if (!studio) return res.status(404).json({ message: 'Studio not found' });
        if (studio.ownerEmail === req.user.email) {
            return res.status(400).json({ message: 'You cannot book your own studio' });
        }

        const bookings = await getBookingCollection();
        const clash = await bookings.findOne({
            studioId,
            date,
            status: 'Confirmed',
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        });
        if (clash) {
            return res.status(409).json({ message: 'This time slot is already booked. Choose another time.' });
        }

        const result = await bookings.insertOne({
            studioId,
            studioTitle: studio.title,
            studioImage: studio.image,
            date,
            startTime,
            endTime,
            totalPrice: hours * studio.hourlyRate,
            status: 'Pending',
            userEmail: req.user.email,
            userName: req.user.name,
            createdAt: new Date(),
        });
        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        console.error('Add Booking Error:', error);
        res.status(500).json({ message: 'Failed to create booking' });
    }
}

export async function getMyBookings(req, res) {
    try {
        const bookingCol = await getBookingCollection();
        const bookings = await bookingCol.find({ userEmail: req.user.email }).sort({ _id: -1 }).toArray();
        const enrichedBookings = [];
        for (const booking of bookings) {
            let studioCategory = null;
            let studioLocation = null;
            if (booking.studioId) {
                const studio = await (await getStudioCollection()).findOne({ _id: new ObjectId(booking.studioId) });
                if (studio) {
                    studioCategory = studio.category;
                    studioLocation = studio.location;
                }
            }
            enrichedBookings.push({ ...booking.toObject ? booking.toObject() : booking, studioCategory, studioLocation });
        }
        res.status(200).json(enrichedBookings);
    } catch (error) {
        console.error('My Bookings Error:', error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
}

export async function cancelBooking(req, res) {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const bookings = await getBookingCollection();
        const filter = { _id: new ObjectId(req.params.id) };
        const booking = await bookings.findOne(filter);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userEmail !== req.user.email) {
            return res.status(403).json({ message: 'Forbidden: not your booking' });
        }
        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
        }

        await bookings.updateOne(filter, { $set: { status: 'Cancelled' } });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        res.status(500).json({ message: 'Failed to cancel booking' });
    }
}

export async function confirmBooking(req, res) {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }
        const bookings = await getBookingCollection();
        const filter = { _id: new ObjectId(req.params.id) };
        const booking = await bookings.findOne(filter);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userEmail !== req.user.email) {
            return res.status(403).json({ message: 'Forbidden: not your booking' });
        }
        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending bookings can be confirmed' });
        }
        const clash = await bookings.findOne({
            _id: { $ne: filter._id },
            studioId: booking.studioId,
            date: booking.date,
            status: 'Confirmed',
            startTime: { $lt: booking.endTime },
            endTime: { $gt: booking.startTime },
        });
        if (clash) {
            return res.status(409).json({ message: 'Another confirmed booking already covers this time slot.' });
        }
        await bookings.updateOne(filter, { $set: { status: 'Confirmed' } });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Confirm Booking Error:', error);
        res.status(500).json({ message: 'Failed to confirm booking' });
    }
}