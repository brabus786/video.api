import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';

export interface TokenData {
	token: string;
	createdAt: Date;
	expiresAt: Date;
	isActive: boolean;
}

export interface TokenValidationResult {
	valid: boolean;
	error?: string;
	data?: TokenData;
}

class TokenService {
	private tokens: Map<string, TokenData>;

	constructor() {
		this.tokens = new Map();
	}

	/**
	 * Creates a new token for the room
	 */
	generateToken(): TokenData {
		const token = uuidv4();
		const expiresAt = new Date(Date.now() + config.tokenExpiryMinutes * 60 * 1000);

		const tokenData: TokenData = {
			token,
			createdAt: new Date(),
			expiresAt,
			isActive: true
		};

		this.tokens.set(token, tokenData);


		return tokenData;
	}

	/**
	 * Validates the token
	 */
	validateToken(token: string): TokenValidationResult {
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
	 * Deactivates the token
	 */
	deactivateToken(token: string): boolean {
		const tokenData = this.tokens.get(token);
		if (!tokenData) return false;
		tokenData.isActive = false;
		this.tokens.set(token, tokenData);
		return true;
	}
}

const tokenService = new TokenService();
export default tokenService;
