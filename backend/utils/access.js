const User = require('../models/User');

// Subjects are stored as "Grade 10: Math". Returns the subject names for one grade.
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

// Can this user read a student's records (attendance, marks, progress)?
// Students: only their own. Teachers: students they teach. Admins: everyone.
const canViewStudent = async (user, studentUsername) => {
    if (!user || !studentUsername) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'student') return user.username === studentUsername;
    if (user.role === 'teacher') {
        const student = await User.findOne({ username: studentUsername, role: 'student' })
            .select('username grade assignedSubjects');
        return Boolean(student) && teachesStudent(user, student);
    }
    return false;
};

// Can this user read and post in a chat room? Room names used by the app:
//   admin_<username>          support chat between one user and the admins
//   Group_<grade>             class group for a grade
//   <student>_<teacher>       one-to-one student/teacher chat
const canAccessRoom = async (user, room) => {
    if (!user || typeof room !== 'string' || !room) return false;
    if (user.role === 'admin') return true;
    if (room === `admin_${user.username}`) return true;

    if (room.startsWith('Group_')) {
        const grade = room.slice('Group_'.length);
        if (user.role === 'student') return user.grade === grade;
        if (user.role === 'teacher') return (user.assignedGrades || []).includes(grade);
        return false;
    }

    if (room.startsWith('admin_')) return false;

    if (user.role === 'student' && room.startsWith(`${user.username}_`)) {
        const teacher = room.slice(user.username.length + 1);
        return Boolean(await User.exists({ username: teacher, role: 'teacher' }));
    }
    if (user.role === 'teacher' && room.endsWith(`_${user.username}`)) {
        const student = room.slice(0, -(user.username.length + 1));
        return Boolean(await User.exists({ username: student, role: 'student' }));
    }
    return false;
};

module.exports = { subjectsForGrade, teachesStudent, canViewStudent, canAccessRoom };
