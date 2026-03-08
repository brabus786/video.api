const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class TokenService {
  constructor() {
    // In-memory storage (для production использовать Redis)
    this.tokens = new Map();
  }

  /**
   * Создает новый токен для комнаты
   */
  generateToken() {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + config.tokenExpiryMinutes * 60 * 1000);
    
    const tokenData = {
      token,
      createdAt: new Date(),
      expiresAt,
      isActive: true
    };

    this.tokens.set(token, tokenData);

    // Автоматическое удаление по истечении времени
    setTimeout(() => {
      this.tokens.delete(token);
    }, config.tokenExpiryMinutes * 60 * 1000);

    return tokenData;
  }

  /**
   * Валидирует токен
   */
  validateToken(token) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return { valid: false, error: 'Token not found' };
    }

    if (!tokenData.isActive) {
      return { valid: false, error: 'Token is inactive' };
    }

    if (new Date() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, data: tokenData };
  }

  /**
   * Деактивирует токен
   */
  deactivateToken(token) {
    const tokenData = this.tokens.get(token);
    if (tokenData) {
      tokenData.isActive = false;
    }
  }

  /**
   * Получает информацию о токене
   */
  getTokenInfo(token) {
    return this.tokens.get(token);
  }
}

module.exports = new TokenService();
