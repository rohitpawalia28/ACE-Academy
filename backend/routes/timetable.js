const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// ROUTE 1: Teacher adds a new schedule entry
router.post('/add', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { batch, date, subject, topic } = req.body;
        const postedBy = req.user.username;
        const newEntry = new Timetable({ batch, date, subject, topic, postedBy });
        await newEntry.save();
        res.status(201).json({ message: "Timetable updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update timetable" });
    }
});

// ROUTE 2: Student fetches their schedule
router.get('/:batch', async (req, res) => {
    try {
        if (req.user.role === 'student' && req.user.grade !== req.params.batch) {
            return res.status(403).json({ message: 'You do not have access to this.' });
        }
        const schedule = await Timetable.find({ batch: req.params.batch }).sort({ date: 1 });
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch timetable" });
    }
});

// ROUTE 3: Get ALL schedules (For Teachers to manage)
router.get('/', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const schedule = await Timetable.find().sort({ date: 1 });
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all timetables" });
    }
});

// ROUTE 4: DELETE a timetable entry
router.delete('/:id', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete' });
    }
});

module.exports = router;