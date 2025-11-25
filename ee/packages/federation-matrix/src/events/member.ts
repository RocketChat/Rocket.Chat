import { Room } from '@rocket.chat/core-services';
import type { IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, UserID, RoomID, PduForType } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';

const logger = new Logger('federation-matrix:member');

export async function getOrCreateFederatedUser(matrixId: UserID): Promise<IUser | null> {
	try {
		const serverName = federationSDK.getConfig('serverName');
		const [username, userServerName, isLocal] = getUsernameServername(matrixId, serverName);

		let user = await Users.findOneByUsername(username);

		if (user) {
			return user;
		}

		if (isLocal) {
			logger.warn(`Local user ${username} not found for Matrix ID: ${matrixId}`);
			return null;
		}

		logger.info(`Creating federated user for Matrix ID: ${matrixId}`);

		const userId = await createOrUpdateFederatedUser({
			username: matrixId,
			name: matrixId,
			origin: userServerName,
		});

		user = await Users.findOneById(userId);

		if (!user) {
			logger.error(`Failed to retrieve user after creation: ${matrixId}`);
			return null;
		}

		return user;
	} catch (error) {
		logger.error(`Error getting or creating federated user ${matrixId}:`, error);
		return null;
	}
}

export async function getOrCreateFederatedRoom(
	roomName: RoomID, // matrix room ID
	roomFName: string,
	roomType: RoomType,
	inviterUserId: UserID,
): Promise<IRoom | null> {
	try {
		const room = await Rooms.findOne({ 'federation.mrid': roomName });
		if (room) {
			return room;
		}

		logger.info(`Creating federated room for Matrix room ID: ${roomName} with name: ${roomFName}`);

		const createdRoom = await Room.create(inviterUserId, {
			type: roomType,
			name: roomName,
			options: {
				federatedRoomId: roomName,
				creator: inviterUserId,
			},
			extraData: {
				federated: true,
				fname: roomFName,
			},
		});

		logger.info(`Successfully created federated room ${createdRoom._id} for Matrix room ${roomName}`);
		return createdRoom;
	} catch (error) {
		logger.error(`Error getting or creating federated room ${roomName}:`, error);
		return null;
	}
}

export async function handleInvite(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
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

	const room = await getOrCreateFederatedRoom(roomId, roomFName, roomType, inviterUser._id as UserID);
	if (!room) {
		logger.error(`Room not found or could not be created: ${roomId}`);
		return;
	}

	await Room.addUserToRoom(room._id, inviteeUser, inviterUser, {
		status: 'INVITED',
		inviterUsername: inviterUser.username,
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
	emitter.on('homeserver.matrix.membership', async ({ event }) => {
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
			logger.error('Failed to process Matrix membership event:', error);
		}
	});
}
