require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// Database Models
const User = require('./models/User');
const Log = require('./models/Log');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Register user when they log in
  socket.on('register_user', (username) => {
    socket.username = username;
    console.log(`User registered on socket: ${username}`);
  });

  // Join a specific chat room
  socket.on('join_chat', (room) => {
    socket.join(room);
    console.log(`User joined chat room: ${room}`);
  });

  // Save and send messages
  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time,
        date: data.date,
        type: data.type || 'text',
      });
      await newMessage.save();
      socket.to(data.room).emit('receive_message', data);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Read receipt logic
  socket.on('mark_read', async (data) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB');

    const receiptMsg = `${data.reader} has read the messages.`;

    const receiptData = {
      room: data.room,
      author: 'System',
      message: receiptMsg,
      time,
      date,
      type: 'system',
    };

    try {
      const newSystemMsg = new Message(receiptData);
      await newSystemMsg.save();
      socket.to(data.room).emit('read_receipt', receiptData);
    } catch (error) {
      console.error('Error saving read receipt:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.username) {
      try {
        const user = await User.findOne({ username: socket.username });
        if (user) {
          user.activeSessionToken = null;
          await user.save();

          const autoLog = new Log({
            username: user.username,
            role: user.role,
            action: 'Auto-Logged Out (Tab Closed)',
          });
          await autoLog.save();

          console.log(`Cleared stuck session for: ${socket.username}`);
        }
      } catch (err) {
        console.error('Error during auto-logout:', err);
      }
    }
  });
});

// Connect to MongoDB Atlas
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB successfully connected!'))
  .catch((error) => console.log('MongoDB connection failed:', error));

app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/records', require('./routes/records'));

// Start server
server.listen(PORT, () => {
  console.log(`Server and Live Chat running on port ${PORT}`);
});
