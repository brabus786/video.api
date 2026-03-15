require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  tokenExpiryMinutes: parseInt(process.env.TOKEN_EXPIRY_MINUTES) || 15,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  meteredApiKey: process.env.METERED_API_KEY || '',
  meteredApiUrl: process.env.METERED_API_URL || '',
  turnUrl: process.env.TURN_URL || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnCredential: process.env.TURN_CREDENTIAL || ''
};
