const tokenService = require('../services/tokenService');
const roomService = require('../services/roomService');
const config = require('../config/config');

class RoomController {
  /**
   * POST /api/room/create
   * Создает новую комнату и возвращает ссылку с токеном
   */
  createRoom(req, res) {
    try {
      // Генерируем токен
      const tokenData = tokenService.generateToken();
      
      // Создаем комнату
      const room = roomService.createRoom(tokenData.token);

      // Формируем ссылку (в production использовать реальный домен)
      const link = `${req.protocol}://${req.get('host')}/join/${tokenData.token}`;

      res.status(201).json({
        success: true,
        data: {
          roomId: room.roomId,
          token: tokenData.token,
          link,
          expiresAt: tokenData.expiresAt,
          expiresIn: `${config.tokenExpiryMinutes} minutes`
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create room'
      });
    }
  }

  /**
   * GET /api/room/:token
   * Проверяет валидность токена и возвращает информацию о комнате
   */
  getRoomByToken(req, res) {
    try {
      const { token } = req.params;

      // Валидируем токен
      const validation = tokenService.validateToken(token);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Получаем комнату
      const room = roomService.getRoomByToken(token);

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      res.json({
        success: true,
        data: {
          roomId: room.roomId,
          participantsCount: room.participants.length,
          maxParticipants: room.maxParticipants,
          isAvailable: room.participants.length < room.maxParticipants,
          expiresAt: validation.data.expiresAt
        }
      });
    } catch (error) {
      console.error('Error getting room:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get room'
      });
    }
  }
}

module.exports = new RoomController();
