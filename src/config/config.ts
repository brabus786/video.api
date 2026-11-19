import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
	port: number;
	nodeEnv: string;
	tokenExpiryMinutes: number;
	corsOrigin: string;
	turnUrl: string;
	turnUsername: string;
	turnCredential: string;
}

const config: AppConfig = {
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
	nodeEnv: process.env.NODE_ENV || 'development',
	tokenExpiryMinutes: process.env.TOKEN_EXPIRY_MINUTES ? parseInt(process.env.TOKEN_EXPIRY_MINUTES, 10) : 15,
	corsOrigin: process.env.CORS_ORIGIN || '*',
	turnUrl: process.env.TURN_URL || '',
	turnUsername: process.env.TURN_USERNAME || '',
	turnCredential: process.env.TURN_CREDENTIAL || ''
};

const turnSettings = [config.turnUrl, config.turnUsername, config.turnCredential];
if (turnSettings.some(Boolean) && !turnSettings.every(Boolean)) {
	throw new Error('TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL must be configured together.');
}

export default config;
