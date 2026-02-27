const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    username: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "Logged In", "Uploaded Notes"
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);