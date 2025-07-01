
import { Room } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '@rocket.chat/models';

export function invite(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.accept-invite', async (data) => {
		const room = await MatrixBridgedRoom.findOne({ mri: data.room_id });
		if (!room) {
			console.warn(`No bridged room found for room_id: ${data.room_id}`);
			return;
		}

		const localUser = await Users.findOneByUsername(data.sender);
		if (localUser) {
			await Room.addUserToRoom(room.rid, localUser);
			return;
		}

		const { insertedId } = await Users.insertOne({
			username: data.sender,
			type: 'user',
			status: UserStatus.ONLINE,
			active: true,
			roles: ['user'],
			name: data.content.displayname || data.sender,
			requirePasswordChange: false,
			createdAt: new Date(),
			_updatedAt: new Date(),
			federated: true,
		});
		const serverName = data.sender.split(':')[1] || 'unknown';
		const bridgedUser = await MatrixBridgedUser.findOne({ mri: data.sender });

		if (!bridgedUser) {
			await MatrixBridgedUser.createOrUpdateByLocalId(insertedId, data.sender, true, serverName);
		}
		const user = await Users.findOneById(insertedId);
		if (!user) {
			console.warn(`User with ID ${insertedId} not found after insertion`);
			return;
		}
		await Room.addUserToRoom(room.rid, user);
	});
}
