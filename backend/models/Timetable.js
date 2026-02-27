const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    batch: { type: String, required: true },
    date: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    postedBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);