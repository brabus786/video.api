

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

Set your environment variables in `.env` (see `.env.example`).



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
