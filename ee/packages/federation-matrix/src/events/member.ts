import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:member');

export function member(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.leave', async (data) => {
		try {
			logger.info('Received Matrix leave event:', {
				event_id: data.event_id,
				room_id: data.room_id,
				user_id: data.user_id,
			});

			const room = await MatrixBridgedRoom.findOne({ mri: data.room_id });
			if (!room) {
				logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			const matrixUser = await MatrixBridgedUser.findOne({ mui: data.user_id });
			if (!matrixUser) {
				logger.warn(`No bridged user found for Matrix user_id: ${data.user_id}`);
				return;
			}

			const user = await Users.findOneById(matrixUser.uid);
			if (!user) {
				logger.error(`No Rocket.Chat user found for bridged user: ${matrixUser.uid}`);
				return;
			}

			await Room.removeUserFromRoom(room.rid, user);

			logger.info(`User ${user.username} left room ${room.rid} via Matrix federation`);
		} catch (error) {
			logger.error('Failed to process Matrix leave event:', error);
		}
	});

	emitter.on('homeserver.matrix.kick', async (data) => {
		try {
			logger.info('Received Matrix kick event:', {
				event_id: data.event_id,
				room_id: data.room_id,
				kicked_user_id: data.kicked_user_id,
				kicked_by: data.kicked_by,
				reason: data.reason,
			});

			const room = await MatrixBridgedRoom.findOne({ mri: data.room_id });
			if (!room) {
				logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			const kickedMatrixUser = await MatrixBridgedUser.findOne({ mui: data.kicked_user_id });
			if (!kickedMatrixUser) {
				logger.warn(`No bridged user found for kicked Matrix user_id: ${data.kicked_user_id}`);
				return;
			}

			const kickedUser = await Users.findOneById(kickedMatrixUser.uid);
			if (!kickedUser) {
				logger.error(`No Rocket.Chat user found for kicked bridged user: ${kickedMatrixUser.uid}`);
				return;
			}

			const kickerMatrixUser = await MatrixBridgedUser.findOne({ mui: data.kicked_by });
			let kickerUsername = 'Matrix User';
			if (kickerMatrixUser) {
				const kickerUser = await Users.findOneById(kickerMatrixUser.uid);
				if (kickerUser) {
					kickerUsername = kickerUser.username || 'Matrix User';
				}
			}

			const kickerUser = kickerMatrixUser ? await Users.findOneById(kickerMatrixUser.uid) : null;
			await Room.removeUserFromRoom(room.rid, kickedUser, {
				byUser: kickerUser || { _id: 'matrix.federation', username: kickerUsername },
			});

			const reasonText = data.reason ? ` Reason: ${data.reason}` : '';
			logger.info(`User ${kickedUser.username} was kicked from room ${room.rid} by ${kickerUsername} via Matrix federation.${reasonText}`);
		} catch (error) {
			logger.error('Failed to process Matrix kick event:', error);
		}
	});
}
