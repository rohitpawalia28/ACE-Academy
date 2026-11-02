const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Log = require('../models/Log');
const { signToken, verifyToken, requireAuth, requireRole } = require('../middleware/auth');

const ROLES = ['admin', 'teacher', 'student'];

// --- ROUTE 1: ADMIN CREATE USER ---
// Only a logged-in admin can create accounts.
router.post('/register', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !ROLES.includes(role)) {
            return res.status(400).json({ message: 'Username, password and a valid role are required' });
        }

        // 1. Check if user already exists
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // 2. Encrypt the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save the new user to the database
        user = new User({
            username,
            password: hashedPassword,
            role
        });
        await user.save();

        res.status(201).json({ message: `${role} account created successfully!` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ROUTE 2: USER LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 1. Find the user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // 2. Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // 3. ENFORCE DOUBLE LOGIN RULE
        // Only a session that is still valid blocks a new login, so expired or
        // revoked sessions can't lock anyone out.
        if (user.activeSessionToken && verifyToken(user.activeSessionToken)) {
            return res.status(403).json({ 
                message: 'Access Denied: You are already logged in on another device.' 
            });
        }

        // 4. Generate a new token and save it to the database
        const token = signToken(user);
        user.activeSessionToken = token;
        await user.save();

        res.json({ message: 'Login successful', token, role: user.role });
        // --- RECORD LOG ---
        const loginLog = new Log({
            username: user.username,
            role: user.role,
            action: 'Logged In'
        });
        await loginLog.save();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ROUTE 3: USER LOGOUT ---
router.post('/logout', requireAuth, async (req, res) => {
    try {
        // Log out the user the token belongs to, not whoever is named in the body
        const user = await User.findById(req.user._id);
        if (!user) return res.status(400).json({ message: 'User not found' });

        user.activeSessionToken = null;
        await user.save();

        res.json({ message: 'Logged out successfully' });
        // --- RECORD LOG ---
        const logoutLog = new Log({
            username: user.username,
            role: user.role,
            action: 'Logged Out'
        });
        await logoutLog.save();
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout' });
    }
});

// --- ROUTE 4: CHANGE PASSWORD ---
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: 'All password fields are required' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Change the password of the logged-in user only
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        const passwordLog = new Log({
            username: user.username,
            role: user.role,
            action: 'Password Changed'
        });
        await passwordLog.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during password change' });
    }
});

module.exports = router;
