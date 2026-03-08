const tokenService = require('../services/tokenService');
const roomService = require('../services/roomService');

/**
 * WebRTC Signaling через Socket.IO
 */
function setupSignaling(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    /**
     * Присоединение к комнате по токену
     */
    socket.on('join-room', ({ token }, callback) => {
      try {
        // Валидация токена
        const validation = tokenService.validateToken(token);
        
        if (!validation.valid) {
          return callback({ 
            success: false, 
            error: validation.error 
          });
        }

        // Получаем или создаем комнату
        let room = roomService.getRoomByToken(token);
        
        if (!room) {
          room = roomService.createRoom(token);
        }

        // Добавляем участника
        const result = roomService.addParticipant(room.roomId, socket.id);

        if (!result.success) {
          return callback({ success: false, error: result.error });
        }

        // Присоединяемся к Socket.IO room
        socket.join(room.roomId);

        // Уведомляем других участников
        socket.to(room.roomId).emit('user-joined', {
          socketId: socket.id,
          participantsCount: room.participants.length
        });

        console.log(`👤 User ${socket.id} joined room ${room.roomId}`);

        callback({ 
          success: true, 
          roomId: room.roomId,
          participantsCount: room.participants.length
        });

      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    /**
     * WebRTC Offer
     */
    socket.on('offer', ({ offer, roomId }) => {
      console.log(`📤 Offer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('offer', {
        offer,
        senderId: socket.id
      });
    });

    /**
     * WebRTC Answer
     */
    socket.on('answer', ({ answer, roomId }) => {
      console.log(`📥 Answer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('answer', {
        answer,
        senderId: socket.id
      });
    });

    /**
     * ICE Candidate
     */
    socket.on('ice-candidate', ({ candidate, roomId }) => {
      console.log(`🧊 ICE candidate from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        senderId: socket.id
      });
    });

    /**
     * Отключение
     */
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // Находим комнату пользователя
      const roomData = roomService.findRoomBySocket(socket.id);
      
      if (roomData) {
        const { roomId, room } = roomData;
        
        // Уведомляем других участников
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          participantsCount: room.participants.length - 1
        });

        // Удаляем участника из комнаты
        roomService.removeParticipant(roomId, socket.id);
      }
    });

    /**
     * Явное покидание комнаты
     */
    socket.on('leave-room', ({ roomId }) => {
      console.log(`👋 User ${socket.id} leaving room ${roomId}`);
      
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      socket.leave(roomId);
      roomService.removeParticipant(roomId, socket.id);
    });
  });

  return io;
}

module.exports = setupSignaling;
