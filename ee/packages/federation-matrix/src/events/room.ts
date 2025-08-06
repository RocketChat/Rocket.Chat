import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '@rocket.chat/models';
const logger = new Logger('federation-matrix:reaction');

export function room(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.room.name', async (data) => {
		const { name,  sender, room_id } = data as unknown as { name: string, sender: string, room_id: string };
		
		await Room.saveRoomName(room_id, name, sender);
		
	});
	
	emitter.on('homeserver.matrix.room.topic', async (data) => {
		const { topic, sender, room_id } = data as unknown as { topic: string, sender: string, room_id: string };
		
		const localUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(sender);
		if (!localUserId) {	
			logger.error(`No local user ID found for sender ${sender}`);
			return;
		}
		
		const user = await Users.findOneById(localUserId);
		if (!user) {
			logger.error(`No local user found for user ID ${localUserId}`);
			return;
		}
		
		const localRoomId = await MatrixBridgedRoom.getLocalRoomId(room_id);
		if (!localRoomId) {
			logger.error(`No local room ID found for room ${room_id}`);
			return;
		}
		
		await Room.saveRoomTopic(localRoomId, topic, { _id: user._id, username: user.username as string });
	});
	
	emitter.on('homeserver.matrix.user.role', async (data) => {
		const { room_id: roomId, powers, sender } = data;
		
		const localSender = await MatrixBridgedUser.getLocalUserIdByExternalId(sender);
		if (!localSender) {
			logger.error(`No local user ID found for sender ${sender}`);
			return;
		}
		
		const localRoomId = await MatrixBridgedRoom.getLocalRoomId(roomId);
		if (!localRoomId) {
			logger.error(`No local room ID found for room ${roomId}`);
			return;
		}
		
		for (const [userId, power] of Object.entries(powers)) {
			const localUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(userId);
			if (!localUserId) {
				logger.error(`No local user ID found for user ${userId}`);
				continue;
			}
			
			const user = await Users.findOneById(localUserId);
			if (!user) {
				logger.error(`No local user found for user ID ${localUserId}`);
				continue;
			}
			
			let role: 'owner' | 'leader' | 'moderator' | 'user' = 'user';
			if (power === 100) {
				role = 'owner';
			} else if (power === 50) {
				role = 'leader';
			} else {
				role = 'moderator';
			}
			
			await Room.addRoomModerator(localSender, user._id, localRoomId, role);
		}
	});
}
