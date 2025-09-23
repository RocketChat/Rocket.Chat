import type { HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:member');

export function member(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.membership', async (data) => {
		try {
			// Only handle leave events (including kicks)
			if (data.content.membership !== 'leave') {
				logger.debug(`Ignoring membership event with membership: ${data.content.membership}`);
				return;
			}

			const room = await Rooms.findOne({ 'federation.mrid': data.room_id }, { projection: { _id: 1 } });
			if (!room) {
				logger.warn(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			// state_key is the user affected by the membership change
			const affectedUser = await Users.findOne({ 'federation.mui': data.state_key });
			if (!affectedUser) {
				logger.error(`No Rocket.Chat user found for bridged user: ${data.state_key}`);
				return;
			}

			// Check if this is a kick (sender != state_key) or voluntary leave (sender == state_key)
			if (data.sender === data.state_key) {
				// Voluntary leave
				await Room.removeUserFromRoom(room._id, affectedUser);
				logger.info(`User ${affectedUser.username} left room ${room._id} via Matrix federation`);
			} else {
				// Kick - find who kicked
				const kickerUser = await Users.findOne({ 'federation.mui': data.sender });

				await Room.removeUserFromRoom(room._id, affectedUser, {
					byUser: kickerUser || { _id: 'matrix.federation', username: 'Matrix User' },
				});

				const reasonText = data.content.reason ? ` Reason: ${data.content.reason}` : '';
				logger.info(`User ${affectedUser.username} was kicked from room ${room._id} by ${data.sender} via Matrix federation.${reasonText}`);
			}
		} catch (error) {
			logger.error('Failed to process Matrix membership event:', error);
		}
	});
}
