import { injectable } from 'tsyringe';
import { api } from '@rocket.chat/core-services';
import { Rooms, Users } from '@rocket.chat/models';

/**
 * Bridge between homeserver events and Rocket.Chat
 * Handles syncing data between Matrix and Rocket.Chat
 */
@injectable()
export class RocketChatEventBridge {
	/**
	 * Called when a Matrix room is created
	 */
	async onMatrixRoomCreated(matrixRoomId: string, roomData: any): Promise<void> {
		// Check if this room already exists in Rocket.Chat
		const existingRoom = await Rooms.findOneByFederationId(matrixRoomId);
		if (existingRoom) {
			return;
		}

		// Create corresponding Rocket.Chat room
		const rcRoom = await Rooms.createRoom({
			type: 'c', // channel
			name: roomData.name || matrixRoomId,
			description: roomData.topic,
			federated: true,
			federationId: matrixRoomId,
		});

		// Emit event for other services
		api.broadcast('federation.roomCreated', {
			roomId: rcRoom._id,
			matrixRoomId,
		});
	}

	/**
	 * Called when a Matrix user joins
	 */
	async onMatrixUserJoined(matrixUserId: string, matrixRoomId: string): Promise<void> {
		// Find or create user
		const user = await this.findOrCreateUser(matrixUserId);
		
		// Find room
		const room = await Rooms.findOneByFederationId(matrixRoomId);
		if (!room) {
			return;
		}

		// Add user to room
		await Rooms.addUsernameById(room._id, user.username);
	}

	/**
	 * Called when a Matrix message is received
	 */
	async onMatrixMessage(event: any): Promise<void> {
		const room = await Rooms.findOneByFederationId(event.room_id);
		if (!room) {
			return;
		}

		const user = await this.findOrCreateUser(event.sender);

		// Create message in Rocket.Chat
		api.broadcast('federation.messageReceived', {
			roomId: room._id,
			userId: user._id,
			text: event.content.body,
			federationEventId: event.event_id,
		});
	}

	/**
	 * Link a Rocket.Chat room to a Matrix room
	 */
	async linkRoom(rcRoomId: string, matrixRoomId: string): Promise<void> {
		await Rooms.setFederationId(rcRoomId, matrixRoomId);
	}

	/**
	 * Link a Rocket.Chat user to a Matrix user
	 */
	async linkUser(rcUserId: string, matrixUserId: string): Promise<void> {
		await Users.setFederationId(rcUserId, matrixUserId);
	}

	private async findOrCreateUser(matrixUserId: string): Promise<any> {
		// Check if user exists
		const existingUser = await Users.findOneByFederationId(matrixUserId);
		if (existingUser) {
			return existingUser;
		}

		// Parse Matrix user ID (e.g., @user:domain.com)
		const match = matrixUserId.match(/@([^:]+):(.+)/);
		if (!match) {
			throw new Error(`Invalid Matrix user ID: ${matrixUserId}`);
		}

		const [, username, domain] = match;

		// Create federated user
		const user = await Users.create({
			username: `${username}.${domain}`,
			name: username,
			type: 'user',
			federated: true,
			federationId: matrixUserId,
		});

		return user;
	}
}