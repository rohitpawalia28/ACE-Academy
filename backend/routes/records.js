const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const User = require('../models/User');

router.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Error fetching profile' }); }
});

router.get('/students', async (req, res) => {
    try {
        const { teacher } = req.query;
        if (teacher) {
            const teacherObj = await User.findOne({ username: teacher });
            if (teacherObj && teacherObj.assignedGrades) {
                const students = await User.find({ role: 'student', grade: { $in: teacherObj.assignedGrades } }).select('username name grade');
                return res.json(students);
            }
        }
        const students = await User.find({ role: 'student' }).select('username name grade');
        res.json(students);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch students' }); }
});

router.get('/teachers', async (req, res) => {
    try {
        const { student } = req.query;
        if (student) {
            const studentObj = await User.findOne({ username: student });
            if (studentObj && studentObj.grade) {
                const teachers = await User.find({ role: 'teacher', assignedGrades: studentObj.grade }).select('username name');
                return res.json(teachers);
            }
        }
        const teachers = await User.find({ role: 'teacher' }).select('username name');
        res.json(teachers);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch teachers' }); }
});

// --- NEW: Fetch Admins for Technical Support Chat ---
router.get('/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('username name');
        res.json(admins);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch admins' }); }
});

// --- NEW: Fetch Attendance for a specific date so teachers can see if it's already marked ---
router.get('/attendance/:date', async (req, res) => {
    try {
        const records = await Attendance.find({ date: req.params.date });
        res.json(records);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch existing attendance' }); }
});

// --- UPDATED: Save Attendance (Skips 'Not my student' and saves the Teacher's signature) ---
router.post('/attendance', async (req, res) => {
    try {
        const { date, records, markedBy } = req.body; 
        for (let record of records) {
            if (record.status === 'Not my student') {
                // Ignore these. If they previously marked them, delete the old mark.
                await Attendance.findOneAndDelete({ date: date, studentUsername: record.username, markedBy: markedBy });
            } else {
                await Attendance.findOneAndUpdate(
                    { date: date, studentUsername: record.username },
                    { status: record.status, markedBy: markedBy },
                    { upsert: true, new: true }
                );
            }
        }
        res.json({ message: 'Attendance saved successfully!' });
    } catch (error) { res.status(500).json({ message: 'Failed to save attendance' }); }
});

router.post('/marks', async (req, res) => {
    try {
        const { date, subject, topic, maxMarks, records } = req.body;
        for (let record of records) {
            await Mark.findOneAndUpdate(
                { date: date, subject: subject, topic: topic, studentUsername: record.username },
                { maxMarks: maxMarks, marksObtained: record.marksObtained, grade: record.grade },
                { upsert: true, new: true }
            );
        }
        res.json({ message: 'Exam marks saved successfully!' });
    } catch (error) { res.status(500).json({ message: 'Failed to save marks' }); }
});

router.get('/stats/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const attendanceRecords = await Attendance.find({ studentUsername: username }).sort({ date: -1 });
        const totalClasses = attendanceRecords.length;
        const presentClasses = attendanceRecords.filter(r => r.status === 'Present').length;
        const attendancePercent = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);
        const marksRecords = await Mark.find({ studentUsername: username }).sort({ date: -1 });

        res.json({
            attendance: { percent: attendancePercent, total: totalClasses, present: presentClasses, history: attendanceRecords },
            marks: marksRecords
        });
    } catch (error) { res.status(500).json({ message: 'Failed to fetch stats' }); }
});

module.exports = router;