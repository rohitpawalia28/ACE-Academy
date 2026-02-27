const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: { type: String, required: true },
    author: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
    date: { type: String }, // NEW: Stores the specific date
    type: { type: String, default: 'text' } // NEW: 'text' or 'system' (for read receipts)
});

module.exports = mongoose.model('Message', messageSchema);