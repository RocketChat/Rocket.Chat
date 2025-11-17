import { Room, Upload } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { federationSDK, type HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';
import { MatrixMediaService } from '../services/MatrixMediaService';

const logger = new Logger('federation-matrix:member');

async function downloadAndSetAvatar(user: IUser, avatarUrl: string): Promise<void> {
	try {
		if (!avatarUrl || !avatarUrl.startsWith('mxc://')) {
			return;
		}

		logger.debug(`Downloading avatar for user ${user.username}: ${avatarUrl}`);

		const parsed = MatrixMediaService.parseMXCUri(avatarUrl);
		if (!parsed) {
			logger.warn(`Invalid MXC URI: ${avatarUrl}`);
			return;
		}

		const buffer = await federationSDK.downloadFromRemoteServer(parsed.serverName, parsed.mediaId);
		if (!buffer) {
			logger.warn(`Failed to download avatar from ${avatarUrl}`);
			return;
		}

		// detect content type from buffer (basic image type detection)
		let contentType = 'image/png';
		if (buffer[0] === 0xff && buffer[1] === 0xd8) {
			contentType = 'image/jpeg';
		} else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
			contentType = 'image/png';
		} else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
			contentType = 'image/gif';
		} else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
			contentType = 'image/webp';
		}

		await Upload.setUserAvatar(user, buffer, contentType, 'rest');
	} catch (error) {
		logger.error(`Error downloading/setting avatar for user ${user.username}:`, error);
	}
}

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
			return;
		}
		await Room.addUserToRoom(room._id, localUser);
		return;
	}

	if (!serverName) {
		throw new Error('Invalid sender format, missing server name');
	}

	const stateKey = data.state_key || (data.event as any)?.state_key;
	const existingUser = await Users.findOneByUsername(stateKey);
	const oldAvatarUrl = existingUser?.federation?.avatarUrl;
	const newAvatarUrl = data.content.avatar_url;

	const insertedId = await createOrUpdateFederatedUser({
		username: stateKey,
		origin: serverName,
		name: data.content.displayname || (stateKey as `@${string}:${string}`),
		avatarUrl: newAvatarUrl,
	});

	const user = await Users.findOneById(insertedId, { projection: { _id: 1, username: 1, federation: 1 } });

	if (!user) {
		console.warn(`User with ID ${insertedId} not found after insertion`);
		return;
	}

	if (newAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
		logger.debug(`Avatar changed for ${user.username}: ${oldAvatarUrl} -> ${newAvatarUrl}`);
		void downloadAndSetAvatar(user, newAvatarUrl);
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
