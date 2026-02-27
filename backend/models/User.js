const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // 'admin', 'teacher', 'student'
    activeSessionToken: { type: String, default: null },

    // --- NEW: Admin Control Fields ---
    name: { type: String },
    
    // For Teachers:
    assignedGrades: [{ type: String }], // e.g., ['Grade 9', 'Grade 10']
    assignedSubjects: [{ type: String }], // e.g., ['Math', 'Science']
    
    // For Students:
    grade: { type: String }, // e.g., 'Grade 9'
    startDate: { type: String },
    feeStructure: { type: String },
    timing: { type: String }
});

module.exports = mongoose.model('User', userSchema);