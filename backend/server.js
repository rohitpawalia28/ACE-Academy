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
const { requireAuth, requireRole, userFromToken } = require('./middleware/auth');
const { canAccessRoom } = require('./utils/access');

const MAX_MESSAGE_LENGTH = 2000;

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = [
  CLIENT_URL,
  process.env.CLIENT_URL_2,
  process.env.CLIENT_URL_3,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server / curl / thunder client
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true; // fallback for Vercel previews
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // The app sends its login token right after the dashboard opens. Until that
  // checks out, the socket can't join rooms or send anything.
  socket.authReady = Promise.resolve(null);

  const authenticate = (token) => {
    socket.authReady = userFromToken(token)
      .then((user) => {
        if (user) {
          socket.user = user;
          socket.username = user.username;
          console.log(`User registered on socket: ${user.username}`);
        }
        return user;
      })
      .catch((err) => {
        console.error('Socket auth failed:', err);
        return null;
      });
  };

  // The app sends { token } here. A bare username (older app versions) is ignored.
  socket.on('register_user', (payload) => {
    if (payload && typeof payload === 'object' && payload.token) authenticate(payload.token);
  });
  socket.on('authenticate', (token) => authenticate(token));

  // Join a chat room, only if this user belongs in it
  socket.on('join_chat', async (room) => {
    const user = await socket.authReady;
    if (!user || !(await canAccessRoom(user, room).catch(() => false))) return;
    socket.join(room);
  });

  // Save and send messages
  socket.on('send_message', async (data) => {
    try {
      const user = await socket.authReady;
      if (!user || !data || !socket.rooms.has(data.room)) return;
      if (typeof data.message !== 'string' || !data.message.trim()) return;

      const msg = {
        room: data.room,
        author: user.username, // always the logged-in user, never what the client claims
        message: data.message.slice(0, MAX_MESSAGE_LENGTH),
        time: typeof data.time === 'string' ? data.time : '',
        date: typeof data.date === 'string' ? data.date : '',
        type: 'text',
      };
      await new Message(msg).save();
      socket.to(msg.room).emit('receive_message', msg);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Read receipt logic
  socket.on('mark_read', async (data) => {
    const user = await socket.authReady;
    if (!user || !data || !socket.rooms.has(data.room)) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB');

    const reader = user.role === 'admin' ? 'Admin' : (user.name || user.username);
    const receiptMsg = `${reader} has read the messages.`;

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
app.use('/api/admin', requireAuth, requireRole('admin'), require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/records', require('./routes/records'));

// Start server
server.listen(PORT, () => {
  console.log(`Server and Live Chat running on port ${PORT}`);
});
