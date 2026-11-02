import jwt from 'jsonwebtoken';
import { COOKIE_OPTIONS } from '../config/cookie.js';

export async function createJwt(req, res) {
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
}

export function clearJwt(req, res) {
    res.clearCookie('studio_token', { ...COOKIE_OPTIONS, maxAge: undefined });
    res.status(200).json({ success: true });
}