import type { HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { Rooms, Users } from '@rocket.chat/models';

export function invite(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.accept-invite', async (data) => {
		const room = await Rooms.findOne({ 'federation.mrid': data.room_id });
		if (!room) {
			console.warn(`No bridged room found for room_id: ${data.room_id}`);
			return;
		}

		const internalUsername = data.sender;
		const localUser = await Users.findOneByUsername(internalUsername);
		if (localUser) {
			await Room.addUserToRoom(room._id, localUser);
			return;
		}

		const [, serverName] = data.sender.split(':');
		if (!serverName) {
			throw new Error('Invalid sender format, missing server name');
		}

		const { insertedId } = await Users.insertOne({
			username: internalUsername,
			type: 'user',
			status: UserStatus.ONLINE,
			active: true,
			roles: ['user'],
			name: data.content.displayname || internalUsername,
			requirePasswordChange: false,
			createdAt: new Date(),
			_updatedAt: new Date(),
			federated: true,
			federation: {
				version: 1,
				mui: data.sender,
				origin: serverName,
			},
		});

		const user = await Users.findOneById(insertedId);
		if (!user) {
			console.warn(`User with ID ${insertedId} not found after insertion`);
			return;
		}
		await Room.addUserToRoom(room._id, user);
	});
}
