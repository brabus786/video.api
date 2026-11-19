

# Video Call API (Backend)

Backend for peer-to-peer video calls using Node.js, Express, WebRTC, and Socket.IO.

## Tech Stack

- **Node.js** (Express)
- **Socket.IO** (WebSocket signaling)
- **WebRTC** (peer-to-peer media)
- **TypeScript**

## Features

- Unique room/token generation (TTL: 15 minutes)
- WebRTC signaling via Socket.IO
- Modular, in-memory architecture (easy to migrate to Redis)
- REST API for room management




## Installation

```bash
yarn install
```



## Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Set your environment variables in `.env`. Configure all three TURN variables together to enable TURN; if any one is set without the others, the API exits with a configuration error.



## Running

### Development
```bash
yarn dev
```
Server will run at [http://localhost:3000](http://localhost:3000)

### Production
```bash
yarn build
yarn start
```



## Security & Publishing

**Important:** Never commit real `.env` files or secrets to your repository. Only use `.env.example` for reference.


## Run

### Production
```bash
yarn build
yarn start
```

### Development (with auto-reload)
```bash
yarn dev
```



## API Overview

### REST Endpoints

- **POST `/api/room/create`** — Create a new room
- **GET `/api/room/:token`** — Get room info by token
- **GET `/api/webrtc/ice-servers`** — Get the configured STUN/TURN servers
- **GET `/health`** — Health check

Example response for room creation:
```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "token": "uuid",
    "link": "http://localhost:3000/join/token",
    "expiresAt": "2026-03-08T12:00:00Z",
    "expiresIn": "15 minutes"
  }
}
```


### WebSocket Events

#### Client → Server
- `join-room` — Join a room
- `offer` — Send WebRTC offer
- `answer` — Send WebRTC answer
- `ice-candidate` — Send ICE candidate
- `leave-room` — Leave the room

#### Server → Client
- `user-joined` — A user joined the room
- `offer` — Offer received
- `answer` — Answer received
- `ice-candidate` — ICE candidate received
- `user-left` — A user left the room

### WebRTC ICE configuration

`GET /api/webrtc/ice-servers` returns the configured STUN servers and, when all TURN variables are set, a TURN server with its username and credential. The client must pass the returned `iceServers` to `RTCPeerConnection`.

To test TURN specifically, temporarily create the peer connection with relay-only transport:

```js
const { data } = await fetch('/api/webrtc/ice-servers').then((response) => response.json());
const peerConnection = new RTCPeerConnection({
  iceServers: data.iceServers,
  iceTransportPolicy: 'relay'
});
```

Remove `iceTransportPolicy: 'relay'` after the test so normal calls can use direct connections when available. In `chrome://webrtc-internals`, verify the selected ICE candidate pair contains a `relay` candidate. The TURN server must advertise its public relay address and allow its relay port range through both the cloud firewall and the host firewall.

src/



## Project Structure

```
src/
├── app.ts                 # Main application file
├── config/
│   └── config.ts         # Configuration
├── controllers/
│   └── roomController.ts # REST API controller
├── services/
│   ├── tokenService.ts   # Token management
│   └── roomService.ts    # Room management
└── socket/
  └── signaling.ts      # WebRTC signaling logic
```


## Scaling & Production

- Use **Redis** for distributed token/room storage
- Use **Socket.IO Redis Adapter** for horizontal scaling
- Use **PostgreSQL/MongoDB** for call history (optional)
- Use **Nginx/HAProxy** with sticky sessions for load balancing

## Example Usage

```js
// Client-side
const socket = io('http://localhost:3000');

// Get token from API
const response = await fetch('http://localhost:3000/api/room/create', { method: 'POST' });
const { data } = await response.json();
console.log('Share this link:', data.link);

// Join the room
socket.emit('join-room', { token: data.token }, (response) => {
  if (response.success) {
    console.log('Joined room:', response.roomId);
  }
});
```

## License

ISC
