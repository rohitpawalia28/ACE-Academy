const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Log = require('../models/Log');
const bcrypt = require('bcrypt'); // <-- NEW: Import the encryption tool

// Admin creates a new user
router.post('/create-user', async (req, res) => {
    try {
        const { 
            name, username, password, role, 
            assignedGrades, assignedSubjects, 
            grade, startDate, feeStructure, timing 
        } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists!" });
        }

        // --- NEW: Encrypt the password before saving ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user with the HASHED password
        const newUser = new User({
            name, username, 
            password: hashedPassword, // <-- Save the scrambled password
            role,
            assignedGrades, assignedSubjects,
            grade, startDate, feeStructure, timing
        });

        await newUser.save();
        res.status(201).json({ message: `${role} created successfully!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error creating user" });
    }
});

// Fetch all users for Admin to view
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password'); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// --- LOGS: list login / logout activity (newest first) ---
// Optional filters: ?username=  ?role=student|teacher
router.get('/logs', async (req, res) => {
    try {
        const { username, role } = req.query;
        const filter = {};
        if (username) filter.username = username;
        if (role) filter.role = role;
        const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(2000);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch logs' });
    }
});

// --- LOGS: delete one entry ---
router.delete('/logs/:id', async (req, res) => {
    try {
        const deleted = await Log.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Log not found' });
        res.json({ message: 'Log deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid log id' });
    }
});

// --- LOGS: delete many. Body: { username } or { role } or { all: true } ---
router.delete('/logs', async (req, res) => {
    try {
        const { username, role, all } = req.body || {};
        const filter = {};
        if (username) filter.username = username;
        else if (role) filter.role = role;
        else if (all !== true) return res.status(400).json({ message: 'Choose a user, a role, or all logs to delete' });
        const result = await Log.deleteMany(filter);
        res.json({ message: `${result.deletedCount} log(s) deleted`, deleted: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete logs' });
    }
});

module.exports = router;
