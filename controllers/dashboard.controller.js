import { getStudioCollection, getBookingCollection } from '../config/db.js';

export async function getDashboardStats(req, res) {
    try {
        const studioCol = await getStudioCollection();
        const bookingCol = await getBookingCollection();

        const totalStudios = await studioCol.countDocuments({});
        const myStudios = await studioCol.countDocuments({ ownerEmail: req.user.email });
        const totalBookings = await bookingCol.countDocuments({});
        const pendingBookings = await bookingCol.countDocuments({ userEmail: req.user.email, status: "Pending" });
        const confirmedBookings = await bookingCol.countDocuments({ userEmail: req.user.email, status: "Confirmed" });

        res.status(200).json({
            totalStudios,
            myStudios,
            totalBookings,
            pendingBookings,
            confirmedBookings,
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
}
