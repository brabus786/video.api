const { v4: uuidv4 } = require('uuid');

class RoomService {
  constructor() {
    // In-memory storage (для production использовать Redis)
    this.rooms = new Map();
  }

  /**
   * Создает новую комнату
   */
  createRoom(token) {
    const roomId = uuidv4();
    
    const room = {
      roomId,
      token,
      participants: [],
      createdAt: new Date(),
      maxParticipants: 2 // для 1-на-1 видео звонков
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Получает комнату по токену
   */
  getRoomByToken(token) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.token === token) {
        return room;
      }
    }
    return null;
  }

  /**
   * Получает комнату по ID
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Добавляет участника в комнату
   */
  addParticipant(roomId, socketId, participantInfo = {}) {
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

    const participant = {
      socketId,
      joinedAt: new Date(),
      ...participantInfo
    };

    room.participants.push(participant);
    return { success: true, participant, room };
  }

  /**
   * Удаляет участника из комнаты
   */
  removeParticipant(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants = room.participants.filter(p => p.socketId !== socketId);

    // Удаляем пустую комнату
    if (room.participants.length === 0) {
      this.rooms.delete(roomId);
    }

    return true;
  }

  /**
   * Находит комнату участника по socketId
   */
  findRoomBySocket(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.some(p => p.socketId === socketId)) {
        return { roomId, room };
      }
    }
    return null;
  }

  /**
   * Получает другого участника в комнате
   */
  getOtherParticipant(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.participants.find(p => p.socketId !== socketId);
  }
}

module.exports = new RoomService();
