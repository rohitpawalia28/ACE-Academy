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

// Subjects stored as "Grade 10: Math". Returns the subject names for one grade.
const subjectsForGrade = (list, grade) =>
    (list || []).filter((s) => s.startsWith(grade + ': ')).map((s) => s.slice(grade.length + 2));

// A teacher teaches a student if they share the grade and at least one subject.
// Missing subject data, or "All Subjects" (Grades 3-8), counts as a match.
const teachesStudent = (teacher, student) => {
    if (!student.grade || !(teacher.assignedGrades || []).includes(student.grade)) return false;
    const tSubs = subjectsForGrade(teacher.assignedSubjects, student.grade);
    const sSubs = subjectsForGrade(student.assignedSubjects, student.grade);
    if (tSubs.length === 0 || sSubs.length === 0) return true;
    if (tSubs.includes('All Subjects') || sSubs.includes('All Subjects')) return true;
    return sSubs.some((sub) => tSubs.includes(sub));
};

router.get('/students', async (req, res) => {
    try {
        const { teacher } = req.query;
        if (teacher) {
            const teacherObj = await User.findOne({ username: teacher });
            if (teacherObj && teacherObj.assignedGrades) {
                const students = await User.find({ role: 'student', grade: { $in: teacherObj.assignedGrades } })
                    .select('username name grade assignedSubjects');
                return res.json(students.filter((s) => teachesStudent(teacherObj, s)));
            }
        }
        const students = await User.find({ role: 'student' }).select('username name grade assignedSubjects');
        res.json(students);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch students' }); }
});

router.get('/teachers', async (req, res) => {
    try {
        const { student } = req.query;
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