import { Room, Upload } from '@rocket.chat/core-services';
import { isBannedSubscription } from '@rocket.chat/core-typings';
import type { IRoomNativeFederated, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { federationSDK, type HomeserverEventSignatures, type PduForType } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import debounce from 'lodash.debounce';
import mem from 'mem';

import { createOrUpdateFederatedUser } from '../helpers/createOrUpdateFederatedUser';
import { extractDomainFromMatrixUserId } from '../helpers/extractDomainFromMatrixUserId';
import { getUsernameServername } from '../helpers/getUsernameServername';
import { MatrixMediaService } from '../services/MatrixMediaService';

const logger = new Logger('federation-matrix:member');

async function downloadAndSetAvatar(user: IUser, avatarUrl: string | null): Promise<void> {
	try {
		// if no avatarUrl is provided, it means the user removed his avatar, so we need to set an empty avatar to remove the avatar from their side as well
		if (!avatarUrl) {
			await Upload.resetUserAvatar(user);
			return;
		}

		if (!avatarUrl?.startsWith('mxc://')) {
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
		let contentType: string | undefined;
		if (buffer[0] === 0xff && buffer[1] === 0xd8) {
			contentType = 'image/jpeg';
		} else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
			contentType = 'image/png';
		} else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
			contentType = 'image/gif';
		} else if (
			buffer[0] === 0x52 &&
			buffer[1] === 0x49 &&
			buffer[2] === 0x46 &&
			buffer[3] === 0x46 &&
			buffer[8] === 0x57 &&
			buffer[9] === 0x45 &&
			buffer[10] === 0x42 &&
			buffer[11] === 0x50
		) {
			contentType = 'image/webp';
		}

		if (!contentType) {
			logger.warn({ msg: 'Unsupported remote avatar format from external server', username: user.username, avatarUrl });
			return;
		}

		// TODO need to perform a validation to check if the user actually changed avatar
		await Upload.setUserAvatar(user, buffer, contentType, 'rest');
	} catch (error) {
		logger.error({ err: error, user: user.username, msg: `Error downloading/setting avatar for user` });
	}
}

async function getOrCreateFederatedUser(userId: string): Promise<IUser> {
	try {
		const serverName = federationSDK.getConfig('serverName');
		const [username, userServerName, isLocal] = getUsernameServername(userId, serverName);

		const user = await Users.findOneByUsername(username);
		if (user) {
			return user;
		}

		if (isLocal) {
			throw new Error(`Local user ${username} not found for Matrix ID: ${userId}`);
		}

		return createOrUpdateFederatedUser({
			username: userId,
			name: userId,
			origin: userServerName,
		});
	} catch (err) {
		logger.error({ msg: 'Error getting or creating federated user', err, userId });
		throw new Error(`Error getting or creating federated user ${userId}`);
	}
}

async function getOrCreateFederatedRoom({
	matrixRoomId,
	roomName,
	roomFName,
	roomType,
	inviterUserId,
	inviterUsername,
	inviteeUsername,
}: {
	matrixRoomId: string;
	roomName: string;
	roomFName: string;
	roomType: RoomType;
	inviterUserId: string;
	inviterUsername: string;
	inviteeUsername?: string;
}): Promise<IRoom> {
	try {
		const room = await Rooms.findOne({ 'federation.mrid': matrixRoomId });
		if (room) {
			return room;
		}

		const origin = matrixRoomId.split(':').pop();
		if (!origin) {
			throw new Error(`Room origin not found for Matrix ID: ${matrixRoomId}`);
		}

		// TODO room creator is not always the inviter

		return Room.create<IRoomNativeFederated>(inviterUserId, {
			type: roomType,
			name: roomName,
			members: inviteeUsername ? [inviteeUsername, inviterUsername] : [inviterUsername],
			options: {
				forceNew: true, // an invite means the room does not exist yet
				creator: inviterUserId,
			},
			extraData: {
				federated: true,
				federation: {
					version: 1,
					mrid: matrixRoomId,
					origin,
				},
				...(roomType !== 'd' && { fname: roomFName }), // DMs do not have a fname
			},
		});
	} catch (err) {
		logger.error({ msg: 'Error getting or creating federated room', err, roomName });
		throw new Error(`Error getting or creating federated room ${roomName}`);
	}
}

// get the join rule type from the stripped state stored in the unsigned section of the event
// as per the spec, we must support several types but we only support invite and public for now.
// in the future, we must start looking into 'knock', 'knock_restricted', 'restricted' and 'private'.
function getJoinRuleType(strippedState: PduForType<'m.room.join_rules'>[]): 'p' | 'c' | 'd' {
	const joinRulesState = strippedState?.find((state: PduForType<'m.room.join_rules'>) => state.type === 'm.room.join_rules');

	// as per the spec, users need to be invited to join a room, unless the room’s join rules state otherwise.
	if (!joinRulesState) {
		return 'p';
	}

	const joinRule = joinRulesState?.content?.join_rule;
	switch (joinRule) {
		case 'invite':
			return 'p';
		case 'public':
			return 'c';
		case 'knock':
			throw new Error(`Knock join rule is not supported`);
		case 'knock_restricted':
			throw new Error(`Knock restricted join rule is not supported`);
		case 'restricted':
			throw new Error(`Restricted join rule is not supported`);
		case 'private':
			throw new Error(`Private join rule is not supported`);
		default:
			throw new Error(`Unknown join rule type: ${joinRule}`);
	}
}

async function handleInvite({
	sender: senderId,
	state_key: userId,
	room_id: roomId,
	content,
	unsigned,
}: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const inviterUser = await getOrCreateFederatedUser(senderId);
	if (!inviterUser) {
		throw new Error(`Failed to get or create inviter user: ${senderId}`);
	}

	const inviteeUser = await getOrCreateFederatedUser(userId);
	if (!inviteeUser) {
		throw new Error(`Failed to get or create invitee user: ${userId}`);
	}

	const strippedState = unsigned.invite_room_state;

	const joinRuleType = getJoinRuleType(strippedState);

	const roomOriginDomain = senderId.split(':')?.pop();
	if (!roomOriginDomain) {
		throw new Error(`Room origin domain not found: ${roomId}`);
	}

	const roomNameState = strippedState?.find((state: PduForType<'m.room.name'>) => state.type === 'm.room.name');
	const matrixRoomName = roomNameState?.content?.name;

	// DMs do not have a join rule type (they are treated as invite only rooms),
	// so we use 'd' for direct messages translation to RC.
	const roomType = content?.is_direct || !matrixRoomName ? 'd' : joinRuleType;

	let roomName: string;
	let roomFName: string;

	if (roomType === 'd') {
		roomName = senderId;
		roomFName = senderId;
	} else {
		roomName = roomId.replace('!', '').replace(':', '_');
		roomFName = `${matrixRoomName}:${roomOriginDomain}`;
	}

	const room = await getOrCreateFederatedRoom({
		matrixRoomId: roomId,
		roomName,
		roomFName,
		roomType,
		inviterUserId: inviterUser._id,
		inviterUsername: inviterUser.username as string, // TODO: Remove force cast
		inviteeUsername: roomType === 'd' ? inviteeUser.username : undefined,
	});

	if (!room) {
		throw new Error(`Room not found or could not be created: ${roomId}`);
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, inviteeUser._id);
	if (subscription) {
		return;
	}

	await Room.createUserSubscription({
		ts: new Date(),
		room,
		userToBeAdded: inviteeUser,
		inviter: inviterUser,
		status: 'INVITED',
	});

	// if an invite is sent to a DM, we need to update the room name to reflect all participants
	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room);
	}
}

const getUpdateUserNameDebounced = mem((userId: string) => debounce((name: string) => Users.setName(userId, name), 1000));

function updateUserNameDebounced(userId: string, newName: string): void {
	void getUpdateUserNameDebounced(userId)(newName);
}

const getDownloadAndSetAvatarDebounced = mem((_userId: string) =>
	debounce((user: IUser, avatarUrl: string | null) => downloadAndSetAvatar(user, avatarUrl), 2000),
);

function downloadAndSetAvatarDebounced(userId: string, user: IUser, newAvatarUrl: string | null): void {
	void getDownloadAndSetAvatarDebounced(userId)(user, newAvatarUrl);
}

async function handleJoin({
	room_id: roomId,
	state_key: userId,
	content,
}: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const joiningUser = await getOrCreateFederatedUser(userId);
	if (!joiningUser?.username) {
		throw new Error(`Failed to get or create joining user: ${userId}`);
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while joining user ${userId} to room ${roomId}`);
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, joiningUser._id);
	if (!subscription) {
		throw new Error(`Subscription not found while joining user ${userId} to room ${roomId}`);
	}

	const senderServerName = extractDomainFromMatrixUserId(userId);

	// handle avatar updates to membership events
	if (senderServerName !== federationSDK.getConfig('serverName')) {
		// TODO if there is no avatar_url we may want to validate first if we should remove the user avatar because if may be dealing with an old join event, and the user may have changed their avatar since then, so we need to check if the avatar_url is different from the current one before removing it
		void downloadAndSetAvatarDebounced(joiningUser._id, joiningUser, content.avatar_url || null);
	}

	// updates user name whenever we receive a join event, because Matrix sends a new join event with the updated display name whenever a user changes their display name
	if ('displayname' in content && content.displayname !== joiningUser.name) {
		// whan a user changes the it's display name we receive a new join event for every room the user is in
		// so we need to debounce the name update to avoid updating the name multiple times in a row
		void updateUserNameDebounced(joiningUser._id, content.displayname || '');
	}

	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(
			room,
			[subscription._id],
			[{ _id: joiningUser._id, name: content.displayname || joiningUser.name || joiningUser.username, username: joiningUser.username }],
		);
	}

	if (!subscription.status) {
		logger.info('User is already joined to the room, skipping...');
		return;
	}

	await Room.performAcceptRoomInvite(room, subscription, joiningUser);
}

async function handleLeave({
	room_id: roomId,
	state_key: userId,
	sender,
}: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const serverName = federationSDK.getConfig('serverName');
	const [username] = getUsernameServername(userId, serverName);

	const leavingUser = await Users.findOneByUsername(username);
	if (!leavingUser) {
		return;
	}

	const [senderUsername] = getUsernameServername(sender, serverName);

	const senderUser = await Users.findOneByUsername(senderUsername);
	if (!senderUser) {
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while leaving user ${userId} from room ${roomId}`);
	}

	// In Matrix, unban is a leave event for a previously banned user.
	// Check local subscription state to distinguish leave from unban.
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, leavingUser._id);
	if (subscription && isBannedSubscription(subscription)) {
		await Room.performUserUnban(room, leavingUser, senderUser);
		logger.info({ msg: 'Unbanned user via federation leave event', userId: leavingUser._id, roomId: room._id });
		return;
	}

	await Room.performUserRemoval(room, leavingUser);

	// update room name for DMs
	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room);
	}

	// TODO check if there are no pending invites to the room, and if so, delete the room
}

async function handleBan({
	room_id: roomId,
	state_key: userId,
	sender: senderId,
}: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const serverName = federationSDK.getConfig('serverName');
	const [username] = getUsernameServername(userId, serverName);

	const bannedUser = await Users.findOneByUsername(username);
	if (!bannedUser) {
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while banning user ${userId} from room ${roomId}`);
	}

	const [senderUsername] = getUsernameServername(senderId, serverName);
	const senderUser = await Users.findOneByUsername(senderUsername);
	if (!senderUser) {
		throw new Error(`Ban sender not found locally: ${senderUsername} (Matrix id ${senderId})`);
	}

	await Room.performUserBan(room, bannedUser, senderUser);
}

async function handleMembershipRejected({
	event,
	reason,
}: HomeserverEventSignatures['homeserver.matrix.membership.rejected']): Promise<void> {
	const room = await Rooms.findOne({ 'federation.mrid': event.room_id });
	if (!room) {
		logger.debug({ msg: 'No local room found for rejected membership event', roomId: event.room_id, reason });
		return;
	}

	const serverName = federationSDK.getConfig('serverName');
	const [username] = getUsernameServername(event.state_key, serverName);

	const user = await Users.findOneByUsername(username);
	if (!user) {
		logger.debug({ msg: 'User not found for rejected membership event', userId: event.state_key, reason });
		return;
	}

	await Room.revokeInvite(room, user);

	logger.info({
		msg: 'Revoked invite due to rejected membership event',
		userId: user._id,
		roomId: room._id,
		membership: event.content.membership,
		reason,
	});
}

export function member() {
	federationSDK.eventEmitterService.on('homeserver.matrix.membership', async ({ event }) => {
		try {
			switch (event.content.membership) {
				case 'invite':
					await handleInvite(event);
					break;

				case 'join':
					await handleJoin(event);
					break;

				case 'leave':
					await handleLeave(event);
					break;

				case 'ban':
					await handleBan(event);
					break;

				default:
					logger.warn({ msg: 'Unknown membership type', membership: event.content.membership });
			}
		} catch (err) {
			logger.error({ msg: 'Failed to process Matrix membership event', err });
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.membership.rejected', async (payload) => {
		try {
			await handleMembershipRejected(payload);
		} catch (err) {
			logger.error({ msg: 'Failed to process rejected membership event', err });
		}
	});
}
