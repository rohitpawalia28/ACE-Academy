const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: { type: String, required: true },
    studentUsername: { type: String, required: true },
    status: { type: String, required: true }, // 'Present', 'Absent'
    markedBy: { type: String } // <-- NEW: Remembers WHICH teacher marked it
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);