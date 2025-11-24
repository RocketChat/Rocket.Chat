import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, UserID, RoomID, PduForType, EventID } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions } from '@rocket.chat/models';

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

	// we are not handling public rooms yet - in the future we should use 'c' for public rooms
	// as well as should rethink the canAccessRoom authorization logic
	const roomType = content.membership === 'invite' && content?.is_direct ? 'd' : 'p';
	const strippedState = event.unsigned.invite_room_state;

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
		status: 'INVITED',
		federation: { inviteEventId: eventId, inviterUsername: inviterUser.username },
	});
}

async function handleJoin(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const joiningUser = await getOrCreateFederatedUser(userId);
	if (!joiningUser) {
		logger.error(`Failed to get or create joining user: ${userId}`);
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while joining user ${userId} to room ${roomId}`);
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, joiningUser._id, {
		projection: { _id: 1, status: 1, federation: 1 },
	});
	if (!subscription) {
		logger.error(`Subscription not found while joining user ${userId} to room ${roomId}`);
		return;
	}

	await Room.acceptRoomInvite(room, subscription, joiningUser);
}

async function handleLeave(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const leavingUser = await getOrCreateFederatedUser(userId as UserID);
	if (!leavingUser) {
		logger.error(`Failed to get or create leaving user: ${userId}`);
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		logger.error(`Room not found while leaving user ${userId} from room ${roomId}`);
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
			logger.error(error, 'Failed to process Matrix membership event');
		}
	});
}
