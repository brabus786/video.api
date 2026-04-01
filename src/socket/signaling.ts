import { Server, Socket } from 'socket.io';
import tokenService from '../services/tokenService';
import roomService from '../services/roomService';

interface JoinRoomPayload {
	token: string;
}

interface CallbackResponse {
	success: boolean;
	error?: string;
	roomId?: string;
	participantsCount?: number;
}

/**
 * WebRTC Signaling via Socket.IO
 */
function setupSignaling(io: Server): void {
			       io.on('connection', (socket: Socket) => {
				       // --- WebRTC signaling relay ---
				       socket.on('offer', (payload: { offer: any; roomId: string }) => {
					       socket.to(payload.roomId).emit('offer', { offer: payload.offer });
				       });

				       socket.on('answer', (payload: { answer: any; roomId: string }) => {
					       socket.to(payload.roomId).emit('answer', { answer: payload.answer });
				       });

				       socket.on('ice-candidate', (payload: { candidate: any; roomId: string }) => {
					       socket.to(payload.roomId).emit('ice-candidate', { candidate: payload.candidate });
				       });
		       console.log(`🔌 Client connected: ${socket.id}`);

		       socket.on('join-room', (payload: JoinRoomPayload, callback: (response: CallbackResponse) => void) => {
			       try {
				       const validation = tokenService.validateToken(payload.token);
				       if (!validation.valid) {
					       return callback({ success: false, error: validation.error });
				       }
				       let room = roomService.getRoomByToken(payload.token);
				       if (!room) {
					       room = roomService.createRoom(payload.token);
				       }
				       const result = roomService.addParticipant(room.roomId, socket.id);
				       if (!result.success) {
					       return callback({ success: false, error: result.error });
				       }
				       socket.join(room.roomId);
				       socket.to(room.roomId).emit('user-joined', {
					       socketId: socket.id,
					       participantsCount: room.participants.length
				       });
				       console.log(`👤 User ${socket.id} joined room ${room.roomId}`);
				       callback({ success: true, roomId: room.roomId, participantsCount: room.participants.length });
			       } catch (error) {
				       console.error('Error joining room:', error);
				       callback({ success: false, error: 'Failed to join room' });
			       }
		       });

			       socket.on('disconnect', () => {
				       // Find the room where this participant exists
				       for (const [, room] of roomService.rooms.entries()) {
					       if (room.participants.find(p => p.socketId === socket.id)) {
						       roomService.removeParticipant(room.roomId, socket.id);
						       socket.to(room.roomId).emit('user-left', { socketId: socket.id });
						       break;
					       }
				       }
			       });
	       });
}

export default setupSignaling;
