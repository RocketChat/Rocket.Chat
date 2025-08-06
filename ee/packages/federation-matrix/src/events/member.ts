import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { PduJoinRuleEventContent } from '@hs/room';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:member');

export function member(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.membership', async (data) => {
		console.log('membership event', data);
		try {
			// Only handle leave events (including kicks)
			if (data.content.membership !== 'leave') {
				logger.debug(`Ignoring membership event with membership: ${data.content.membership}`);
				return;
			}

			const room = await MatrixBridgedRoom.findOne({ mri: data.room_id });
			if (!room) {
				logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			// state_key is the user affected by the membership change
			const affectedMatrixUser = await MatrixBridgedUser.findOne({ mui: data.state_key });
			if (!affectedMatrixUser) {
				logger.warn(`No bridged user found for Matrix user_id: ${data.state_key}`);
				return;
			}

			const affectedUser = await Users.findOneById(affectedMatrixUser.uid);
			if (!affectedUser) {
				logger.error(`No Rocket.Chat user found for bridged user: ${affectedMatrixUser.uid}`);
				return;
			}

			// Check if this is a kick (sender != state_key) or voluntary leave (sender == state_key)
			if (data.sender === data.state_key) {
				// Voluntary leave
				console.log('voluntary leave', room.rid, affectedUser);
				await Room.removeUserFromRoom(room.rid, affectedUser);
				logger.info(`User ${affectedUser.username} left room ${room.rid} via Matrix federation`);
			} else {
				// Kick - find who kicked
				const kickerMatrixUser = await MatrixBridgedUser.findOne({ mui: data.sender });
				let kickerUser = null;
				if (kickerMatrixUser) {
					kickerUser = await Users.findOneById(kickerMatrixUser.uid);
				}

				await Room.removeUserFromRoom(room.rid, affectedUser, {
					byUser: kickerUser || { _id: 'matrix.federation', username: 'Matrix User' },
				});

				const reasonText = data.content.reason ? ` Reason: ${data.content.reason}` : '';
				logger.info(`User ${affectedUser.username} was kicked from room ${room.rid} by ${data.sender} via Matrix federation.${reasonText}`);
			}
		} catch (error) {
			logger.error('Failed to process Matrix membership event:', error);
		}
	});

	// @ts-ignore
	emitter.on('homeserver.matrix.room.privacy', async (data) => {
		console.log('room privacy event', data);
		const { room_id: roomId, privacy, sender } = data as unknown as { room_id: string; privacy: PduJoinRuleEventContent['join_rule']; sender: string };

		await Room.saveRoomType(roomId, privacy === 'public' ? 'c' : 'p', sender)
	});
}
