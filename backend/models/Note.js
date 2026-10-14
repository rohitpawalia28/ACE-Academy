const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    filePath: { type: String, required: true }, // Download path relative to the backend URL
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file id (new uploads)
    batch: { type: String, required: true },    // Which class gets this note (e.g., 9th)
    uploadedBy: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);