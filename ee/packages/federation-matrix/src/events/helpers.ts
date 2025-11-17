import { Room } from '@rocket.chat/core-services';
import type { IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import type { UserID, RoomID } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser, getUsernameServername } from '../FederationMatrix';

const logger = new Logger('federation-matrix:helpers');

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
	_inviterMatrixId: UserID,
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
