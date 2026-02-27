const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get all messages for a specific room
router.get('/:room', async (req, res) => {
    try {
        // Find messages by room, sorted by oldest to newest
        const messages = await Message.find({ room: req.params.room }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch chat history' });
    }
});

module.exports = router;