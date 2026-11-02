const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { teachesStudent, canViewStudent } = require('../utils/access');

// Every route here needs a logged-in user.
router.use(requireAuth);

// Your own profile (admins can view anyone's).
router.get('/profile/:username', async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.username !== req.params.username) {
            return res.status(403).json({ message: 'You do not have access to this.' });
        }
        const user = await User.findOne({ username: req.params.username }).select('-password -activeSessionToken');
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Error fetching profile' }); }
});

router.get('/students', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        // Teachers only ever see their own students
        const teacher = req.user.role === 'teacher' ? req.user.username : req.query.teacher;
        if (teacher) {
            const teacherObj = await User.findOne({ username: teacher });
            if (teacherObj && teacherObj.assignedGrades) {
                const students = await User.find({ role: 'student', grade: { $in: teacherObj.assignedGrades } })
                    .select('username name grade assignedSubjects');
                return res.json(students.filter((s) => teachesStudent(teacherObj, s)));
            }
        }
        if (req.user.role === 'teacher') return res.json([]);
        const students = await User.find({ role: 'student' }).select('username name grade assignedSubjects');
        res.json(students);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch students' }); }
});

router.get('/teachers', async (req, res) => {
    try {
        // Students only ever see their own teachers
        const student = req.user.role === 'student' ? req.user.username : req.query.student;
        if (student) {
            const studentObj = await User.findOne({ username: student });
            if (studentObj && studentObj.grade) {
                const teachers = await User.find({ role: 'teacher', assignedGrades: studentObj.grade })
                    .select('username name assignedGrades assignedSubjects');
                return res.json(teachers
                    .filter((t) => teachesStudent(t, studentObj))
                    .map((t) => ({ _id: t._id, username: t.username, name: t.name })));
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
router.get('/attendance/:date', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const records = await Attendance.find({ date: req.params.date });
        res.json(records);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch existing attendance' }); }
});

// --- UPDATED: Save Attendance (Skips 'Not my student' and saves the Teacher's signature) ---
router.post('/attendance', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { date, records } = req.body;
        if (!Array.isArray(records)) return res.status(400).json({ message: 'No attendance records sent' });
        const markedBy = req.user.username; // signed by whoever is logged in
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

router.post('/marks', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { date, subject, topic, maxMarks, records } = req.body;
        if (!Array.isArray(records)) return res.status(400).json({ message: 'No marks sent' });
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
        if (!(await canViewStudent(req.user, username))) {
            return res.status(403).json({ message: 'You do not have access to this.' });
        }
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