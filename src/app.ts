import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config/config';
import roomController from './controllers/roomController';
import setupSignaling from './socket/signaling';

const app = express();
const server = http.createServer(app);

const getFallbackIceServers = () => {
	const iceServers: Array<{ urls: string; username?: string; credential?: string }> = [
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

const io = new Server(server, {
	cors: {
		origin: config.corsOrigin,
		methods: ['GET', 'POST']
	}
});

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/webrtc/ice-servers', async (_req: Request, res: Response) => {
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
	} catch (error: any) {
		console.error('Failed to load Metered ICE servers:', error.message);
	}
	return res.json({
		success: true,
		data: {
			iceServers: getFallbackIceServers()
		}
	});
});

app.post('/api/room/create', (req: Request, res: Response) => roomController.createRoom(req, res));
app.get('/api/room/:token', (req: Request, res: Response) => roomController.getRoomByToken(req, res));

setupSignaling(io);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Internal server error' });
});

server.listen(config.port, () => {
	console.log(`🚀 Server running on port ${config.port}`);
	console.log(`📡 WebRTC signaling ready`);
});

export { app, io, server };
