import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '@rocket.chat/models';
import notifications from '../../../../../apps/meteor/app/notifications/server/lib/Notifications';

const logger = new Logger('federation-matrix:events:typing');

export function typing(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.typing', async (data) => {
		try {
			logger.debug('Received typing EDU from Matrix:', data);

			const { room_id: matrixRoomId, user_id: matrixUserId, typing: isTyping } = data;

			// Find the bridged room
			const bridgedRoom = await MatrixBridgedRoom.findOne({ mri: matrixRoomId });
			if (!bridgedRoom) {
				logger.debug('Typing EDU for unknown room, ignoring:', matrixRoomId);
				return;
			}

			// Find the bridged user
			const bridgedUser = await MatrixBridgedUser.findOne({ mui: matrixUserId });
			if (!bridgedUser) {
				logger.debug('Typing EDU from unknown user, ignoring:', matrixUserId);
				return;
			}

			// Get the user's username for Rocket.Chat
			const rcUser = await Users.findOneById(bridgedUser.uid);
			if (!rcUser || !rcUser.username) {
				logger.warn('Could not find Rocket.Chat user for bridged user:', bridgedUser.uid);
				return;
			}

			// Notify Rocket.Chat about the typing status
			notifications.notifyRoom(bridgedRoom.rid, 'user-activity', rcUser.username, isTyping ? ['user-typing'] : []);

			logger.debug('Successfully processed typing EDU:', {
				roomId: bridgedRoom.rid,
				username: rcUser.username,
				isTyping,
			});
		} catch (error) {
			logger.error('Failed to process typing EDU:', error);
		}
	});
}