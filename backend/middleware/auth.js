const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// The signing secret lives in the environment (Render → Environment → JWT_SECRET),
// never in the code. Changing it signs everyone out.
// If it is missing, fall back to a random secret for this run: still impossible to
// forge, but everyone has to log in again whenever the server restarts.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET is not set (or shorter than 32 characters). Using a temporary ' +
        'random secret, so all users are logged out on every restart. Set JWT_SECRET to fix this.');
    JWT_SECRET = crypto.randomBytes(48).toString('hex');
}

const TOKEN_LIFETIME = '30d';

// Fields the access checks need; never the password or session token.
const SAFE_USER_FIELDS = 'username name role grade assignedGrades assignedSubjects';

const signToken = (user) =>
    jwt.sign(
        { userId: String(user._id), username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_LIFETIME }
    );

// Returns the token's payload, or null if it is missing, forged or expired.
const verifyToken = (token) => {
    if (!token || typeof token !== 'string') return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

const readBearerToken = (req) => {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

// Looks up the user a token belongs to. The role comes from the database, so a
// role change takes effect immediately rather than when the token expires.
const userFromToken = async (token) => {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return null;
    return User.findById(payload.userId).select(SAFE_USER_FIELDS);
};

// Rejects the request unless it carries a valid login token. Sets req.user.
const requireAuth = async (req, res, next) => {
    try {
        const user = await userFromToken(readBearerToken(req));
        if (!user) return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth check failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Use after requireAuth: allows only the listed roles.
const requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ message: 'You do not have access to this.' });
};

module.exports = {
    SAFE_USER_FIELDS,
    signToken,
    verifyToken,
    userFromToken,
    requireAuth,
    requireRole,
};
