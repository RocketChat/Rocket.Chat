import { Room } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:member');

async function membershipLeaveAction(data: HomeserverEventSignatures['homeserver.matrix.membership']) {
	const room = await Rooms.findOne({ 'federation.mrid': data.room_id }, { projection: { _id: 1 } });
	if (!room) {
		logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
		return;
	}

	// state_key is the user affected by the membership change
	const affectedUser = await Users.findOne({ 'federation.mui': data.state_key });
	if (!affectedUser) {
		logger.error(`No Rocket.Chat user found for bridged user: ${data.state_key}`);
		return;
	}

	// Check if this is a kick (sender != state_key) or voluntary leave (sender == state_key)
	if (data.sender === data.state_key) {
		// Voluntary leave
		await Room.removeUserFromRoom(room._id, affectedUser);
		logger.info(`User ${affectedUser.username} left room ${room._id} via Matrix federation`);
	} else {
		// Kick - find who kicked
		const kickerUser = await Users.findOne({ 'federation.mui': data.sender });

		await Room.removeUserFromRoom(room._id, affectedUser, {
			byUser: kickerUser || { _id: 'matrix.federation', username: 'Matrix User' },
		});

		const reasonText = data.content.reason ? ` Reason: ${data.content.reason}` : '';
		logger.info(`User ${affectedUser.username} was kicked from room ${room._id} by ${data.sender} via Matrix federation.${reasonText}`);
	}
}

async function membershipJoinAction(data: HomeserverEventSignatures['homeserver.matrix.membership']) {
	const room = await Rooms.findOne({ 'federation.mrid': data.room_id });
	if (!room) {
		logger.warn(`No bridged room found for room_id: ${data.room_id}`);
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
		status: UserStatus.OFFLINE,
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
}

export function member(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.membership', async (data) => {
		try {
			if (data.content.membership === 'leave') {
				return membershipLeaveAction(data);
			}

			if (data.content.membership === 'join') {
				return membershipJoinAction(data);
			}

			logger.debug(`Ignoring membership event with membership: ${data.content.membership}`);

		} catch (error) {
			logger.error('Failed to process Matrix membership event:', error);
		}
	});
}
