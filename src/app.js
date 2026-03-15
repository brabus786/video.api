const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config/config');
const roomController = require('./controllers/roomController');
const setupSignaling = require('./socket/signaling');

const app = express();
const server = http.createServer(app);

const getFallbackIceServers = () => {
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

  return iceServers;
};

const getMeteredIceServers = async () => {
  if (!config.meteredApiKey || !config.meteredApiUrl) {
    return null;
  }

  const separator = config.meteredApiUrl.includes('?') ? '&' : '?';
  const response = await fetch(
    `${config.meteredApiUrl}${separator}apiKey=${encodeURIComponent(config.meteredApiKey)}`
  );

  if (!response.ok) {
    throw new Error(`Metered request failed with status ${response.status}`);
  }

  return response.json();
};

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

app.get('/api/webrtc/ice-servers', async (req, res) => {
  try {
    const meteredIceServers = await getMeteredIceServers();

    if (Array.isArray(meteredIceServers) && meteredIceServers.length > 0) {
      return res.json({
        success: true,
        data: {
          iceServers: meteredIceServers
        }
      });
    }
  } catch (error) {
    console.error('Failed to load Metered ICE servers:', error.message);
  }

  return res.json({
    success: true,
    data: {
      iceServers: getFallbackIceServers()
    }
  });
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
