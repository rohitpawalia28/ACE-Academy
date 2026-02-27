const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    filePath: { type: String, required: true }, // The location of the file on the server
    batch: { type: String, required: true },    // Which class gets this note (e.g., 9th)
    uploadedBy: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);