import { Room } from '@rocket.chat/core-services';
import type { IRoomNativeFederated, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { federationSDK, type HomeserverEventSignatures, type PduForType } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';

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
	} catch (error) {
		logger.error(error, `Error getting or creating federated user ${userId}`);
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
	} catch (error) {
		logger.error(error, `Error getting or creating federated room ${roomName}`);
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

async function handleJoin({
	room_id: roomId,
	state_key: userId,
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

	// update room name for DMs
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
	if (!leavingUser) {
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while leaving user ${userId} from room ${roomId}`);
	}

	await Room.performUserRemoval(room, leavingUser);

	// update room name for DMs
	if (room.t === 'd') {
		await Room.updateDirectMessageRoomName(room);
	}

	// TODO check if there are no pending invites to the room, and if so, delete the room
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
					logger.warn(`Unknown membership type: ${event.content.membership}`);
			}
		} catch (error) {
			logger.error(error, 'Failed to process Matrix membership event');
		}
	});
}
