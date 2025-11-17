import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, UserID, RoomID, PduForType, EventID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';
import { getOrCreateFederatedRoom, getOrCreateFederatedUser } from './helpers';

const logger = new Logger('federation-matrix:member');

export async function handleInvite(
	event: HomeserverEventSignatures['homeserver.matrix.membership']['event'],
	eventId: EventID,
): Promise<void> {
	const { room_id: roomId, sender: senderId, state_key: userId, content } = event;

	const inviterUser = await getOrCreateFederatedUser(senderId as UserID);
	if (!inviterUser) {
		logger.error(`Failed to get or create inviter user: ${senderId}`);
		return;
	}

	const inviteeUser = await getOrCreateFederatedUser(userId as UserID);
	if (!inviteeUser) {
		logger.error(`Failed to get or create invitee user: ${userId}`);
		return;
	}

	const roomType = content.membership === 'invite' && content?.is_direct ? 'd' : 'c';
	const strippedState = event.unsigned.stripped_state;

	const createState = strippedState?.find((state: PduForType<'m.room.create'>) => state.type === 'm.room.create');
	const roomOriginDomain = createState?.sender?.split(':')?.pop();
	if (!roomOriginDomain) {
		throw new Error(`Room origin domain not found: ${roomId}`);
	}

	const roomNameState = strippedState?.find((state: PduForType<'m.room.name'>) => state.type === 'm.room.name');
	const matrixRoomName = roomNameState?.content?.name;

	// if is a DM, use the sender username as the room name
	// otherwise, use the matrix room name and the room origin domain
	let roomName: string;
	if (content?.is_direct) {
		roomName = senderId;
	} else if (matrixRoomName && roomOriginDomain) {
		roomName = `${matrixRoomName}:${roomOriginDomain}`;
	} else {
		roomName = `${roomId}:${roomOriginDomain}`;
	}

	// TODO: Consider refactoring to create federated rooms using the Matrix roomId as the Rocket.Chat room name and set the display (visual) name as the fName property.
	const roomFName = roomName;

	const room = await getOrCreateFederatedRoom(
		roomId as RoomID,
		roomFName,
		roomType,
		inviterUser._id as UserID,
		inviterUser.username as UserID,
	);
	if (!room) {
		logger.error(`Room not found or could not be created: ${roomId}`);
		return;
	}

	await Room.addUserToRoom(room._id, inviteeUser, inviterUser, {
		invited: true,
		federation: { inviteEventId: eventId, inviterUsername: inviterUser.username },
	});
}

async function handleJoin(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const joiningUser = await getOrCreateFederatedUser(userId as UserID);
	if (!joiningUser) {
		logger.error(`Failed to get or create joining user: ${userId}`);
		return;
	}

	// TODO: move DB calls to models package
	const room = await Rooms.findOne({ 'federation.mrid': roomId });
	if (!room) {
		logger.warn(`Join event for unknown room: ${roomId} - user may be joining before room creation event received`);
		return membershipJoinAction(event);
	}

	// TODO: move DB calls to models package
	const subscription = await Subscriptions.findOne({
		'rid': room._id,
		'u._id': joiningUser._id,
	});

	if (!subscription) {
		logger.info(`User ${userId} joining room ${roomId} directly (no prior invite)`);
		return membershipJoinAction(event);
	}

	logger.info(`User ${userId} accepting invite to room ${roomId}`);

	// TODO: move DB calls to models package
	await Subscriptions.updateOne(
		{ _id: subscription._id },
		{
			$unset: {
				'invited': 1,
				'federation.inviteEventId': 1,
				'federation.inviterUsername': 1,
			},
			$set: {
				open: true,
				alert: false,
				_updatedAt: new Date(),
			},
		},
	);
}

async function handleLeave(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const leavingUser = await getOrCreateFederatedUser(userId as UserID);
	if (!leavingUser) {
		logger.error(`Failed to get or create leaving user: ${userId}`);
		return;
	}

	// TODO: move DB calls to models package
	const room = await Rooms.findOne({ 'federation.mrid': roomId });
	if (!room) {
		logger.warn(`Leave event for unknown room: ${roomId}`);
		return;
	}

	await Room.removeUserFromRoom(room._id, leavingUser);
}

async function handleInvite(event: HomeserverEventSignatures['homeserver.matrix.membership']['event'], eventId: EventID): Promise<void> {
	const { room_id: roomId, sender: senderId, state_key: userId, content } = event;

	const inviterUser = await getOrCreateFederatedUser(senderId as UserID);
	if (!inviterUser) {
		logger.error(`Failed to get or create inviter user: ${senderId}`);
		return;
	}

	const inviteeUser = await getOrCreateFederatedUser(userId as UserID);
	if (!inviteeUser) {
		logger.error(`Failed to get or create invitee user: ${userId}`);
		return;
	}

	const roomType = content.membership === 'invite' && content?.is_direct ? 'd' : 'c';
	const strippedState = event.unsigned.stripped_state;

	const createState = strippedState?.find((state: PduForType<'m.room.create'>) => state.type === 'm.room.create');
	const roomOriginDomain = createState?.sender?.split(':')?.pop();

	const roomNameState = strippedState?.find((state: PduForType<'m.room.name'>) => state.type === 'm.room.name');
	const matrixRoomName = roomNameState?.content?.name;

	// if is a DM, use the sender username as the room name
	// otherwise, use the matrix room name and the room origin domain
	let roomName: string;
	if (content?.is_direct) {
		roomName = senderId;
	} else if (matrixRoomName && roomOriginDomain) {
		roomName = `${matrixRoomName}:${roomOriginDomain}`;
	} else {
		roomName = `${roomId}:${roomOriginDomain}`;
	}

	// TODO: Consider refactoring to create federated rooms using the Matrix roomId as the Rocket.Chat room name and set the display (visual) name as the fName property.
	const roomFName = roomName;

	const room = await getOrCreateFederatedRoom(
		roomId as RoomID,
		roomFName,
		roomType,
		inviterUser._id as UserID,
		inviterUser.username as UserID,
	);
	if (!room) {
		logger.error(`Room not found or could not be created: ${roomId}`);
		return;
	}

	await Room.addUserToRoom(room._id, inviteeUser, inviterUser, {
		invited: true,
		federation: { inviteEventId: eventId, inviterUsername: inviterUser.username },
	});
}

async function handleJoin(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const joiningUser = await getOrCreateFederatedUser(userId as UserID);
	if (!joiningUser) {
		logger.error(`Failed to get or create joining user: ${userId}`);
		return;
	}

	// TODO: move DB calls to models package
	const room = await Rooms.findOne({ 'federation.mrid': roomId });
	if (!room) {
		logger.warn(`Join event for unknown room: ${roomId} - user may be joining before room creation event received`);
		return membershipJoinAction(event);
	}

	// TODO: move DB calls to models package
	const subscription = await Subscriptions.findOne({
		'rid': room._id,
		'u._id': joiningUser._id,
	});

	if (!subscription) {
		logger.info(`User ${userId} joining room ${roomId} directly (no prior invite)`);
		return membershipJoinAction(event);
	}

	logger.info(`User ${userId} accepting invite to room ${roomId}`);

	// TODO: move DB calls to models package
	await Subscriptions.updateOne(
		{ _id: subscription._id },
		{
			$unset: {
				'invited': 1,
				'federation.inviteEventId': 1,
				'federation.inviterUsername': 1,
			},
			$set: {
				open: true,
				alert: false,
				_updatedAt: new Date(),
			},
		},
	);
}

async function handleLeave(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const leavingUser = await getOrCreateFederatedUser(userId as UserID);
	if (!leavingUser) {
		logger.error(`Failed to get or create leaving user: ${userId}`);
		return;
	}

	// TODO: move DB calls to models package
	const room = await Rooms.findOne({ 'federation.mrid': roomId });
	if (!room) {
		logger.warn(`Leave event for unknown room: ${roomId}`);
		return;
	}

	await Room.removeUserFromRoom(room._id, leavingUser);
}

export function member(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.membership', async ({ event, event_id: eventId }) => {
		try {
			switch (event.content.membership) {
				case 'invite':
					await handleInvite(event, eventId);
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
			logger.error('Failed to process Matrix membership event:', error);
		}
	});
}
