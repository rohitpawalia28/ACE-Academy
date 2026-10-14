const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Note = require('../models/Note');

// Files are stored in MongoDB (GridFS) instead of the local disk.
// Render's filesystem is ephemeral (wiped on every deploy/restart) and the
// uploads/ folder is gitignored, so disk storage fails in production.
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
});

const getBucket = () =>
    new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'notes' });

// Wrap multer so its errors (e.g. file too large) return a clear JSON message
const handleUpload = (req, res, next) => {
    upload.single('pdfFile')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File too large (max 15 MB)' });
        }
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'Invalid file upload' });
        }
        next();
    });
};

// ROUTE 1: Upload a new note
router.post('/upload', handleUpload, async (req, res) => {
    try {
        const { title, batch, uploadedBy } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const fileId = await new Promise((resolve, reject) => {
            const uploadStream = getBucket().openUploadStream(
                Date.now() + path.extname(req.file.originalname),
                { metadata: { contentType: req.file.mimetype, originalName: req.file.originalname } }
            );
            uploadStream.on('error', reject);
            uploadStream.on('finish', () => resolve(uploadStream.id));
            uploadStream.end(req.file.buffer);
        });

        const newNote = new Note({
            title,
            // The frontend builds the download link as `${BACKEND_URL}/${filePath}`
            filePath: `api/notes/file/${fileId}`,
            fileId,
            batch,
            uploadedBy,
        });

        await newNote.save();
        res.status(201).json({ message: 'Note uploaded successfully!', note: newNote });
    } catch (error) {
        console.error('Note upload failed:', error);
        res.status(500).json({ message: 'Failed to upload note' });
    }
});

// ROUTE 2: Stream / download a stored file
router.get('/file/:id', async (req, res) => {
    try {
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const files = await getBucket().find({ _id: fileId }).toArray();
        if (!files.length) return res.status(404).json({ message: 'File not found' });

        const file = files[0];
        const contentType = file.metadata?.contentType || 'application/octet-stream';
        const originalName = file.metadata?.originalName || file.filename;

        res.set('Content-Type', contentType);
        res.set('Content-Length', file.length);
        res.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);

        getBucket()
            .openDownloadStream(fileId)
            .on('error', () => res.status(404).end())
            .pipe(res);
    } catch (error) {
        res.status(400).json({ message: 'Invalid file id' });
    }
});

// ROUTE 3: Get all notes for a specific batch (For Students)
router.get('/:batch', async (req, res) => {
    try {
        const notes = await Note.find({ batch: req.params.batch }).sort({ uploadDate: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notes' });
    }
});

// ROUTE 4: Get ALL notes (For Teachers to manage)
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ uploadDate: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch all notes' });
    }
});

// ROUTE 5: DELETE a note
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        if (note.fileId) {
            // New notes: remove the file from GridFS
            await getBucket().delete(note.fileId).catch(() => {});
        } else if (note.filePath && fs.existsSync(note.filePath)) {
            // Old notes saved to local disk
            fs.unlinkSync(note.filePath);
        }

        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Note delete failed:', error);
        res.status(500).json({ message: 'Failed to delete note' });
    }
});

module.exports = router;
