import { Request, Response } from 'express';
import tokenService from '../services/tokenService';
import roomService from '../services/roomService';
import config from '../config/config';

class RoomController {
	/**
	 * POST /api/room/create
	 * Creates a new room and returns a link with a token
	 */
	       createRoom(req: Request, res: Response): void {
		       try {
			       const tokenData = tokenService.generateToken();
			       const link = `${req.protocol}://${req.get('host')}/join/${tokenData.token}`;
			       res.status(201).json({
				       success: true,
				       data: {
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
	 * Validates the token and returns room information
	 */
	getRoomByToken(req: Request, res: Response): void {
		try {
			const { token } = req.params;
			const validation = tokenService.validateToken(token);
			if (!validation.valid) {
				res.status(400).json({
					success: false,
					error: validation.error
				});
				return;
			}
			const room = roomService.getRoomByToken(token);
			if (!room) {
				res.status(404).json({
					success: false,
					error: 'Room not found'
				});
				return;
			}
			res.json({
				success: true,
				data: room
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

const roomController = new RoomController();
export default roomController;
