import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedRoom, MatrixBridgedUser, Subscriptions } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:powerLevels');

const matrixPowerLevelToRcRole = (level: number): string | undefined => {
	if (level >= 100) {
		return 'owner';
	}

	if (level >= 50) {
		return 'moderator';
	}

	return undefined;
};

export function powerLevels(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.power_levels', async (data) => {
		try {
			logger.info('Received Matrix power levels event:', {
				event_id: data.event_id,
				room_id: data.room_id,
				sender: data.sender,
			});

			const bridgedRoom = await MatrixBridgedRoom.findOne({ mri: data.room_id });
			if (!bridgedRoom) {
				logger.debug(`No bridged room found for Matrix room ${data.room_id}`);
				return;
			}

			const prevUsers = data.prev_content?.users || {};
			const currUsers = data.content.users || {};

			for await (const [matrixUserId, newLevel] of Object.entries(currUsers)) {
				const oldLevel = prevUsers[matrixUserId] || 0;
				if (oldLevel === newLevel) {
					continue;
				}

				const bridgedUser = await MatrixBridgedUser.findOne({ mui: matrixUserId });
				if (!bridgedUser) {
					continue;
				}

				const subscription = await Subscriptions.findOneByRoomIdAndUserId(bridgedRoom.rid, bridgedUser.uid);
				if (!subscription) {
					continue;
				}

				const oldRole = matrixPowerLevelToRcRole(oldLevel as number);
				const newRole = matrixPowerLevelToRcRole(newLevel as number);

				if (oldRole && oldRole !== newRole) {
					await Subscriptions.removeRoleById(subscription._id, oldRole);
				}
				if (newRole && newRole !== oldRole) {
					await Subscriptions.addRoleById(subscription._id, newRole);
				}

				logger.info(`Updated RC role for user ${bridgedUser.uid}: ${oldRole} -> ${newRole}`);
			}
		} catch (error) {
			logger.error('Failed to process Matrix power levels event:', error);
		}
	});
}
