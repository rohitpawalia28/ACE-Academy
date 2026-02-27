const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

// A secret key used to stamp our login tokens (we will move this to a secure file later)
const JWT_SECRET = 'ace_academy_super_secret_key_2026';

// --- ROUTE 1: ADMIN CREATE USER ---
// You (the admin) will use this to create fixed accounts for students/teachers
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

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

        // 1. Find the user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // 2. Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // 3. ENFORCE DOUBLE LOGIN RULE
        if (user.activeSessionToken) {
            return res.status(403).json({ 
                message: 'Access Denied: You are already logged in on another device.' 
            });
        }

        // 4. Generate a new token and save it to the database
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);
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
router.post('/logout', async (req, res) => {
    try {
        const { username } = req.body;

        // Find the user and set their session token back to null
        const user = await User.findOne({ username });
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

module.exports = router;