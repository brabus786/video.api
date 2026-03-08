const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config/config');
const roomController = require('./controllers/roomController');
const setupSignaling = require('./socket/signaling');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/webrtc/ice-servers', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (config.turnUrl && config.turnUsername && config.turnCredential) {
    iceServers.push({
      urls: config.turnUrl,
      username: config.turnUsername,
      credential: config.turnCredential
    });
  }

  res.json({ success: true, data: { iceServers } });
});

// REST API routes
app.post('/api/room/create', roomController.createRoom);
app.get('/api/room/:token', roomController.getRoomByToken);

// WebRTC signaling setup
setupSignaling(io);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📡 WebRTC signaling ready`);
});

module.exports = { app, io, server };
