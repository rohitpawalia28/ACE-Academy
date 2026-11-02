const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');
const { canAccessRoom } = require('../utils/access');

// Get all messages for a specific room (only for people in that conversation)
router.get('/:room', requireAuth, async (req, res) => {
    try {
        if (!(await canAccessRoom(req.user, req.params.room))) {
            return res.status(403).json({ message: 'You do not have access to this chat.' });
        }
        // Find messages by room, sorted by oldest to newest
        const messages = await Message.find({ room: req.params.room }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch chat history' });
    }
});

module.exports = router;