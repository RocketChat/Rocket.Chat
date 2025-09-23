import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Rooms, Users } from '@rocket.chat/models';

export function room(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.room.name', async (data) => {
		const { room_id: roomId, name, user_id: userId } = data;

		const localRoomId = await Rooms.findOne({ 'federation.mrid': roomId }, { projection: { _id: 1 } });
		if (!localRoomId) {
			throw new Error('mapped room not found');
		}

		const localUserId = await Users.findOne({ 'federation.mui': userId }, { projection: { _id: 1 } });
		if (!localUserId) {
			throw new Error('mapped user not found');
		}

		await Room.saveRoomName(localRoomId._id, localUserId._id, name);
	});

	emitter.on('homeserver.matrix.room.topic', async (data) => {
		const { room_id: roomId, topic, user_id: userId } = data;

		const localRoomId = await Rooms.findOne({ 'federation.mrid': roomId }, { projection: { _id: 1 } });
		if (!localRoomId) {
			throw new Error('mapped room not found');
		}

		const localUserId = await Users.findOne({ 'federation.mui': userId }, { projection: { _id: 1 } });
		if (!localUserId) {
			throw new Error('mapped user not found');
		}

		await Room.saveRoomTopic(localRoomId._id, topic, { _id: localUserId._id, username: userId });
	});

	emitter.on('homeserver.matrix.room.role', async (data) => {
		const { room_id: roomId, user_id: userId, sender_id: senderId, role } = data;

		const localRoomId = await Rooms.findOne({ 'federation.mrid': roomId }, { projection: { _id: 1 } });
		if (!localRoomId) {
			throw new Error('mapped room not found');
		}

		const localUserId = await Users.findOne({ 'federation.mui': userId }, { projection: { _id: 1 } });
		if (!localUserId) {
			throw new Error('mapped user not found');
		}

		const localSenderId = await Users.findOne({ 'federation.mui': senderId }, { projection: { _id: 1 } });
		if (!localSenderId) {
			throw new Error('mapped user not found');
		}

		await Room.addUserRoleRoomScoped(localSenderId._id, localUserId._id, localRoomId._id, role);
	});
}
