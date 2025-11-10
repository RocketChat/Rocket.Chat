import { Room, api, Message } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { federationSDK, type HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';

const logger = new Logger('federation-matrix:member');

async function membershipLeaveAction(data: HomeserverEventSignatures['homeserver.matrix.membership']) {
	const room = await Rooms.findOne({ 'federation.mrid': data.room_id }, { projection: { _id: 1 } });
	if (!room) {
		logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
		return;
	}

	const serverName = federationSDK.getConfig('serverName');

	const [affectedUsername] = getUsernameServername(data.state_key, serverName);
	// state_key is the user affected by the membership change
	const affectedUser = await Users.findOneByUsername(affectedUsername);
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

		const [kickerUsername] = getUsernameServername(data.sender, serverName);
		const kickerUser = await Users.findOneByUsername(kickerUsername);

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

	const [username, serverName, isLocal] = getUsernameServername(data.sender, federationSDK.getConfig('serverName'));

	// for local users we must to remove the @ and the server domain
	const localUser = isLocal && (await Users.findOneByUsername(username));

	if (localUser) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, localUser._id);

		if (subscription) {
			const newDisplayName = data.content.displayname;
			const prevContent = data.event.unsigned?.prev_content;
			const oldDisplayName = prevContent?.displayname;
			const isDisplaynameChange = oldDisplayName && oldDisplayName !== newDisplayName;

			if (newDisplayName && newDisplayName !== localUser.name) {
				// direct DB update for inbound federation events (don't use _setRealName)
				// this is intentional: using _setRealName would trigger afterSaveUser callback
				// which would try to send the update back to Matrix, creating a loop
				await Users.updateOne({ _id: localUser._id }, { $set: { name: newDisplayName } });

				// direct broadcast for federation events (bypasses notifyOnUserChange)
				// we always want to notify clients about federation updates regardless of DB watcher settings
				void api.broadcast('watch.users', {
					clientAction: 'updated',
					id: localUser._id,
					diff: { name: 1 },
					unset: {},
				});

				// send system message if this is a displayname change (not initial join)
				if (isDisplaynameChange) {
					try {
						await Message.saveSystemMessage('user-display-name-changed', room._id, `${oldDisplayName}|${newDisplayName}`, localUser);
					} catch (error) {
						logger.error('Failed to send displayname change system message:', error);
					}
				}
			}

			return;
		}

		await Room.addUserToRoom(room._id, localUser);
		return;
	}

	if (!serverName) {
		throw new Error('Invalid sender format, missing server name');
	}

	// first, check if this is a displayname change for an existing user
	const [existingUsername] = getUsernameServername(data.state_key, federationSDK.getConfig('serverName'));
	const existingUser = await Users.findOneByUsername(existingUsername);

	const newDisplayName = data.content.displayname;
	const prevContent = data.event.unsigned?.prev_content;
	const oldDisplayName = prevContent?.displayname;

	const isDisplaynameChange =
		existingUser && // user exists
		prevContent && // has previous state
		prevContent.membership === 'join' && // was already joined
		oldDisplayName !== newDisplayName && // displayname actually changed
		newDisplayName; // new displayname exists

	if (isDisplaynameChange) {
		// this is a displayname change, not a new join
		// check if user is in this room
		const existingSubscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, existingUser._id);

		if (existingSubscription) {
			// direct DB update for inbound federation events (don't use _setRealName)
			// this is intentional: using _setRealName would trigger afterSaveUser callback
			// which would try to send the update back to Matrix, creating a loop
			await Users.updateOne({ _id: existingUser._id }, { $set: { name: newDisplayName } });

			// direct broadcast for federation events (bypasses notifyOnUserChange)
			// we always want to notify clients about federation updates regardless of DB watcher settings
			void api.broadcast('watch.users', {
				clientAction: 'updated',
				id: existingUser._id,
				diff: { name: 1 },
				unset: {},
			});

			// send system message to the room about the displayname change
			try {
				await Message.saveSystemMessage('user-display-name-changed', room._id, `${oldDisplayName}|${newDisplayName}`, existingUser);
			} catch (error) {
				logger.error('Failed to send displayname change system message:', error);
			}

			logger.info(`Updated displayname for federated user ${existingUser.username} (${existingUser._id})`);
			return;
		}
	}

	// either not a displayname change, or user not in room yet - proceed with createOrUpdate
	const insertedId = await createOrUpdateFederatedUser({
		username: data.event.state_key,
		origin: serverName,
		name: newDisplayName || (data.state_key as `@${string}:${string}`),
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
