const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// ROUTE 1: Teacher updates a student's progress
router.post('/update', async (req, res) => {
    try {
        const { studentUsername, percentage, status, updatedBy } = req.body;
        
        // This clever Mongoose function finds the student and updates them, 
        // OR creates a new record if they don't exist yet! (upsert: true)
        const updatedProgress = await Progress.findOneAndUpdate(
            { studentUsername: studentUsername },
            { percentage, status, updatedBy },
            { new: true, upsert: true } 
        );

        res.json({ message: "Progress updated successfully!", progress: updatedProgress });
    } catch (error) {
        res.status(500).json({ message: "Failed to update progress" });
    }
});

// ROUTE 2: Student fetches their specific progress
router.get('/:username', async (req, res) => {
    try {
        const progress = await Progress.findOne({ studentUsername: req.params.username });
        if (!progress) {
            // If the teacher hasn't graded them yet, return a default 0%
            return res.json({ percentage: 0, status: "No Data Yet" });
        }
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch progress" });
    }
});

module.exports = router;