import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
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