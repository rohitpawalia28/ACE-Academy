const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

// 1. Fetch all courses for the landing page
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ startDate: 1 });
        res.json(courses);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch courses' }); }
});

// 2. Fetch all teachers for the landing page (hiding their passwords/usernames)
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('name assignedGrades assignedSubjects');
        res.json(teachers);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch teachers' }); }
});

module.exports = router;