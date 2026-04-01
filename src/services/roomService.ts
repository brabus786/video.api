import { v4 as uuidv4 } from 'uuid';

export interface Participant {
	socketId: string;
	[key: string]: unknown;
}

export interface Room {
	roomId: string;
	token: string;
	participants: Participant[];
	createdAt: Date;
	maxParticipants: number;
}

export interface AddParticipantResult {
	success: boolean;
	error?: string;
	participant?: Participant;
	room?: Room;
}

class RoomService {
		       removeParticipant(roomId: string, socketId: string): void {
			       const room = this.rooms.get(roomId);
			       if (!room) return;
			       room.participants = room.participants.filter(p => p.socketId !== socketId);
			       if (room.participants.length === 0) {
				       // Remove the room and token if there are no participants left
				       this.rooms.delete(roomId);
				       // Also remove the token
				       try {
					       const tokenService = require('./tokenService').default;
					       tokenService.tokens.delete(room.token);
				       } catch (e) {}
			       } else {
				       this.rooms.set(roomId, room);
			       }
		       }
	public rooms: Map<string, Room>;

	constructor() {
		this.rooms = new Map();
	}

		       createRoom(token: string): Room {
			       // If a room with this token already exists, return it
			       const existingRoom = this.getRoomByToken(token);
			       if (existingRoom) {
				       return existingRoom;
			       }
		       const roomId = uuidv4();
		       const room: Room = {
			       roomId,
			       token,
			       participants: [],
			       createdAt: new Date(),
			       maxParticipants: 2
		       };
		       this.rooms.set(roomId, room);
		       return room;
	       }

	getRoomByToken(token: string): Room | null {
		for (const [, room] of this.rooms.entries()) {
			if (room.token === token) {
				return room;
			}
		}
		return null;
	}

	getRoom(roomId: string): Room | undefined {
		return this.rooms.get(roomId);
	}

	addParticipant(roomId: string, socketId: string, participantInfo: Record<string, unknown> = {}): AddParticipantResult {
		const room = this.rooms.get(roomId);
		if (!room) {
			return { success: false, error: 'Room not found' };
		}
		const existingParticipant = room.participants.find(p => p.socketId === socketId);
		if (existingParticipant) {
			return { success: true, participant: existingParticipant, room };
		}
		if (room.participants.length >= room.maxParticipants) {
			return { success: false, error: 'Room is full' };
		}
		const participant: Participant = { socketId, ...participantInfo };
		room.participants.push(participant);
		this.rooms.set(roomId, room);
		return { success: true, participant, room };
	}
}

const roomService = new RoomService();
export default roomService;
