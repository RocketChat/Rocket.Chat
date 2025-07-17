import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Room } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:membership');

export function membership(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.membership', async (data) => {
		try {
			logger.info('Received Matrix membership event:', {
				event_id: data.event_id,
				room_id: data.room_id,
				sender: data.sender,
				state_key: data.state_key,
				membership: data.content.membership,
			});

			if (data.content.membership !== 'leave') {
				logger.debug('Ignoring non-leave membership event');
				return;
			}

			const bridgedRoom = await MatrixBridgedRoom.findOne({ mri: data.room_id });
			if (!bridgedRoom) {
				logger.debug(`No bridged room found for Matrix room ${data.room_id}`);
				return;
			}

			const [userPart, domain] = data.state_key.split(':');
			if (!userPart || !domain) {
				logger.error('Invalid Matrix user ID format in state_key:', data.state_key);
				return;
			}

			const affectedUsername = userPart.substring(1);
			const affectedUser = await Users.findOneByUsername(affectedUsername);
			if (!affectedUser) {
				logger.debug(`User ${affectedUsername} not found in Rocket.Chat`);
				return;
			}

			const isKick = data.sender !== data.state_key;
			if (isKick) {
				const [senderUserPart, senderDomain] = data.sender.split(':');
				if (!senderUserPart || !senderDomain) {
					logger.error('Invalid Matrix user ID format in sender:', data.sender);
					return;
				}

				const kickingUsername = senderUserPart.substring(1);
				const kickingUser = await Users.findOneByUsername(kickingUsername);
				if (!kickingUser) {
					logger.debug(`Kicking user ${kickingUsername} not found in Rocket.Chat`);
					// Still proceed with removal, but without tracking who kicked
				}

				logger.info(`Processing kick: ${affectedUsername} kicked by ${kickingUsername} from room ${bridgedRoom.rid}`);
			} else {
				logger.info(`Processing voluntary leave: ${affectedUsername} left room ${bridgedRoom.rid}`);
			}

			await Room.removeUserFromRoom(bridgedRoom.rid, affectedUser);

			logger.debug('Matrix membership change processed successfully');
		} catch (error) {
			logger.error('Failed to process Matrix membership event:', error);
		}
	});
}
