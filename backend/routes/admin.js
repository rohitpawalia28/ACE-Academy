const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

module.exports = router;