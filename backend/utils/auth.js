import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';
if (!process.env.JWT_SECRET) {
    console.warn("[Warning] JWT_SECRET is not defined! Using a default secret")
}

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied, missing token'});
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}