import { Room } from '@rocket.chat/core-services';
import type { IRoomNativeFederated, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { federationSDK, type HomeserverEventSignatures, type PduForType } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser } from '../helpers/createOrUpdateFederatedUser';
import { getUsernameServername } from '../helpers/getUsernameServername';

const logger = new Logger('federation-matrix:member');

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

		return Room.create<IRoomNativeFederated>(inviterUserId, {
			type: roomType,
			name: roomName,
			members: inviteeUsername ? [inviteeUsername, inviterUsername] : [inviterUsername],
			options: {
				forceNew: true,
				creator: inviterUserId,
			},
			extraData: {
				federated: true,
				federation: {
					version: 1,
					mrid: matrixRoomId,
					origin,
				},
				...(roomType !== 'd' && { fname: roomFName }),
			},
		});
	} catch (err) {
		logger.error({ msg: 'Error getting or creating federated room', err, roomName });
		throw new Error(`Error getting or creating federated room ${roomName}`);
	}
}

function getJoinRuleType(strippedState: PduForType<'m.room.join_rules'>[]): 'p' | 'c' | 'd' {
	const joinRulesState = strippedState?.find((state) => state.type === 'm.room.join_rules');

	if (!joinRulesState) {
		return 'p';
	}

	const joinRule = joinRulesState?.content?.join_rule;
	switch (joinRule) {
		case 'invite':
			return 'p';
		case 'public':
			return 'c';
		default:
			throw new Error(`Unsupported join rule: ${joinRule}`);
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
	const inviteeUser = await getOrCreateFederatedUser(userId);

	const strippedState = unsigned.invite_room_state;
	const joinRuleType = getJoinRuleType(strippedState);

	const roomOriginDomain = senderId.split(':')?.pop()!;
	const roomNameState = strippedState?.find((state) => state.type === 'm.room.name');
	const matrixRoomName = roomNameState?.content?.name;

	const roomType = content?.is_direct || !matrixRoomName ? 'd' : joinRuleType;

	const roomName =
		roomType === 'd' ? senderId : roomId.replace('!', '').replace(':', '_');
	const roomFName =
		roomType === 'd' ? senderId : `${matrixRoomName}:${roomOriginDomain}`;

	const room = await getOrCreateFederatedRoom({
		matrixRoomId: roomId,
		roomName,
		roomFName,
		roomType,
		inviterUserId: inviterUser._id,
		inviterUsername: inviterUser.username as string,
		inviteeUsername: roomType === 'd' ? inviteeUser.username : undefined,
	});

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, inviteeUser._id);
	if (subscription) return;

	await Room.createUserSubscription({
		ts: new Date(),
		room,
		userToBeAdded: inviteeUser,
		inviter: inviterUser,
		status: 'INVITED',
	});

	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room);
	}
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

	// ✅ FIX: Safe avatar handling
	if ('avatar_url' in content) {
		const currentUser = await Users.findOneById(joiningUser._id);

		if (!content.avatar_url && currentUser?.avatarOrigin === joiningUser.avatarOrigin) {
			await Users.resetAvatar(joiningUser._id);
		}
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while joining user ${userId} to room ${roomId}`);
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, joiningUser._id);
	if (!subscription) {
		throw new Error(`Subscription not found while joining user ${userId} to room ${roomId}`);
	}

	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room, [subscription._id]);
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
}: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const serverName = federationSDK.getConfig('serverName');
	const [username] = getUsernameServername(userId, serverName);

	const leavingUser = await Users.findOneByUsername(username);
	if (!leavingUser) return;

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while leaving user ${userId}`);
	}

	await Room.performUserRemoval(room, leavingUser);

	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room);
	}
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
				default:
					logger.warn({ msg: 'Unknown membership type', membership: event.content.membership });
			}
		} catch (err) {
			logger.error({ msg: 'Failed to process Matrix membership event', err });
		}
	});
}
