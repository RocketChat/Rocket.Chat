import { Room } from '@rocket.chat/core-services';
import type { IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, UserID, PduForType } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';

const logger = new Logger('federation-matrix:member');

export async function getOrCreateFederatedUser(userId: string): Promise<IUser> {
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
		throw new Error(`Error getting or creating federated user ${userId}: ${error}`);
	}
}

export async function getOrCreateFederatedRoom(
	roomName: string, // matrix room ID
	roomFName: string,
	roomType: RoomType,
	inviterUserId: string,
): Promise<IRoom> {
	try {
		const room = await Rooms.findOne({ 'federation.mrid': roomName });
		if (room) {
			return room;
		}

		return Room.create(inviterUserId, {
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
	} catch (error) {
		throw new Error(`Error getting or creating federated room ${roomName}: ${error}`);
	}
}

export async function handleInvite(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, sender: senderId, state_key: userId, content } = event;

	const inviterUser = await getOrCreateFederatedUser(senderId);
	if (!inviterUser) {
		throw new Error(`Failed to get or create inviter user: ${senderId}`);
	}

	const inviteeUser = await getOrCreateFederatedUser(userId);
	if (!inviteeUser) {
		throw new Error(`Failed to get or create invitee user: ${userId}`);
	}

	// we are not handling public rooms yet - in the future we should use 'c' for public rooms
	// as well as should rethink the canAccessRoom authorization logic
	const roomType = content.membership === 'invite' && content?.is_direct ? 'd' : 'p';
	const strippedState = event.unsigned.invite_room_state;

	const roomOriginDomain = senderId.split(':')?.pop();
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
		throw new Error(`Room not found or could not be created: ${roomId}`);
	}

	await Room.addUserToRoom(room._id, inviteeUser, inviterUser, {
		status: 'INVITED',
		inviterUsername: inviterUser.username,
	});
}

async function handleJoin(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const joiningUser = await getOrCreateFederatedUser(userId);
	if (!joiningUser || !joiningUser.username) {
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

	await Room.acceptRoomInvite(room, subscription, joiningUser);
}

async function handleLeave(event: HomeserverEventSignatures['homeserver.matrix.membership']['event']): Promise<void> {
	const { room_id: roomId, state_key: userId } = event;

	const leavingUser = await getOrCreateFederatedUser(userId);
	if (!leavingUser) {
		throw new Error(`Failed to get or create leaving user: ${userId}`);
	}

	const room = await Rooms.findOneFederatedByMrid(roomId);
	if (!room) {
		throw new Error(`Room not found while leaving user ${userId} from room ${roomId}`);
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
			logger.error(error, 'Failed to process Matrix membership event');
		}
	});
}
