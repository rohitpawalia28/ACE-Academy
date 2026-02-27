const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    date: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    studentUsername: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    grade: { type: String, required: true } // Dynamically calculated by teacher's thresholds
}, { timestamps: true });

module.exports = mongoose.model('Mark', markSchema);