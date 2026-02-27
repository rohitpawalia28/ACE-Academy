const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true, unique: true }, // Tied exactly to the student's login ID
    percentage: { type: Number, required: true },
    status: { type: String, required: true }, // e.g., "Excellent", "Good", "Needs Work"
    updatedBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);