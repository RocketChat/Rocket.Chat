import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { MatrixBridgedRoom, MatrixBridgedUser } from '@rocket.chat/models';
import { Room } from '@rocket.chat/core-services';

export function room(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.room.name', async (data) => {
		const { room_id: roomId, name, user_id: userId } = data;
		
		const localRoomId = await MatrixBridgedRoom.getLocalRoomId(roomId);
		if (!localRoomId) {
			throw new Error('mapped room not found');
		}

		const localUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(userId);
		if (!localUserId) {
			throw new Error('mapped user not found');
		}

		await Room.saveRoomName(localRoomId, localUserId, name);
	});
	
	emitter.on('homeserver.matrix.room.topic', async (data) => {
		const { room_id: roomId, topic, user_id: userId } = data;
		
		const localRoomId = await MatrixBridgedRoom.getLocalRoomId(roomId);
		if (!localRoomId) {
			throw new Error('mapped room not found');
		}

		const localUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(userId);
		if (!localUserId) {
			throw new Error('mapped user not found');
		}

		await Room.saveRoomTopic(localRoomId, topic, { _id: localUserId, username: userId });
	});
}
