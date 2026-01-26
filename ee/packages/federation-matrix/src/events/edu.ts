import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:edu');

export const edus = async () => {
	federationSDK.eventEmitterService.on('homeserver.matrix.typing', async (data) => {
		try {
			const matrixRoom = await Rooms.findOne({ 'federation.mrid': data.room_id }, { projection: { _id: 1 } });
			if (!matrixRoom) {
				logger.debug({ msg: 'No bridged room found for Matrix room_id', roomId: data.room_id });
				return;
			}

			void api.broadcast('user.activity', {
				user: data.user_id,
				isTyping: data.typing,
				roomId: matrixRoom._id,
			});
		} catch (err) {
			logger.error({ msg: 'Error handling Matrix typing event', err });
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.presence', async (data) => {
		try {
			const matrixUser = await Users.findOneByUsername(data.user_id);
			if (!matrixUser) {
				logger.debug({ msg: 'No federated user found for Matrix user_id', userId: data.user_id });
				return;
			}

			if (!matrixUser.federated) {
				logger.debug({ msg: 'User is not federated, skipping presence update from Matrix', username: matrixUser.username });
				return;
			}

			const statusMap = {
				online: UserStatus.ONLINE,
				offline: UserStatus.OFFLINE,
				unavailable: UserStatus.AWAY,
			};

			const status = statusMap[data.presence] || UserStatus.OFFLINE;

			if (matrixUser.status === status) {
				logger.debug({ msg: 'User already has target status, skipping update', username: matrixUser.username, status });
				return;
			}

			await Users.updateOne(
				{ _id: matrixUser._id },
				{
					$set: {
						status,
						statusDefault: status,
					},
				},
			);

			const { _id, username, statusText, roles, name } = matrixUser;
			void api.broadcast('presence.status', {
				user: { status, _id, username, statusText, roles, name },
				previousStatus: undefined,
			});
			logger.debug({ msg: 'Updated presence for user from Matrix federation', userId: matrixUser._id, status });
		} catch (err) {
			logger.error({ msg: 'Error handling Matrix presence event', err });
		}
	});
};
