const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    grade: { type: String, required: true },
    subjects: [{ type: String }], // Array of subject names
    startDate: { type: String, required: true }, // 'YYYY-MM-DD'
    price1Month: { type: Number, required: true },
    price6Months: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);