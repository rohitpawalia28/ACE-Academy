const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // <-- NEW: File System module to delete physical files
const Note = require('../models/Note');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ROUTE 1: Upload a new PDF
router.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        const { title, batch, uploadedBy } = req.body;
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const newNote = new Note({
            title: title,
            filePath: req.file.path, 
            batch: batch,
            uploadedBy: uploadedBy
        });

        await newNote.save();
        res.status(201).json({ message: "Note uploaded successfully!", note: newNote });
    } catch (error) {
        res.status(500).json({ message: "Failed to upload note" });
    }
});

// ROUTE 2: Get all notes for a specific batch (For Students)
router.get('/:batch', async (req, res) => {
    try {
        const notes = await Note.find({ batch: req.params.batch }).sort({ uploadDate: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notes" });
    }
});

// ROUTE 3: Get ALL notes (For Teachers to manage)
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ uploadDate: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all notes" });
    }
});

// ROUTE 4: DELETE a note
router.delete('/:id', async (req, res) => {
    try {
        // 1. Find the note in the database
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        // 2. Delete the physical PDF file from the uploads folder
        if (fs.existsSync(note.filePath)) {
            fs.unlinkSync(note.filePath); 
        }

        // 3. Delete the record from MongoDB
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete note' });
    }
});

module.exports = router;