import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:edu');

export const edus = async (emitter: Emitter<HomeserverEventSignatures>) => {
	emitter.on('homeserver.matrix.typing', async (data) => {
		try {
			const matrixRoom = await MatrixBridgedRoom.getLocalRoomId(data.room_id);
			if (!matrixRoom) {
				logger.debug(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			const matrixUser = await MatrixBridgedUser.findOne({ mui: data.user_id });
			if (!matrixUser) {
				logger.debug(`No bridged user found for Matrix user_id: ${data.user_id}`);
				return;
			}

			const user = await Users.findOneById(matrixUser.uid, { projection: { _id: 1, username: 1 } });
			if (!user || !user.username) {
				logger.debug(`User not found for uid: ${matrixUser.uid}`);
				return;
			}

			void api.broadcast('federation-matrix.user.typing', {
				username: user.username,
				isTyping: data.typing,
				roomId: matrixRoom,
			});
		} catch (error) {
			logger.error('Error handling Matrix typing event:', error);
		}
	});

	emitter.on('homeserver.matrix.presence', async (data) => {
		try {
			const matrixUser = await MatrixBridgedUser.findOne({ mui: data.user_id });
			if (!matrixUser) {
				logger.debug(`No bridged user found for Matrix user_id: ${data.user_id}`);
				return;
			}
			const user = await Users.findOneById(matrixUser.uid, {
				projection: { _id: 1, username: 1, statusText: 1, roles: 1, name: 1, status: 1 },
			});
			if (!user) {
				logger.debug(`User not found for uid: ${matrixUser.uid}`);
				return;
			}

			const statusMap = {
				online: UserStatus.ONLINE,
				offline: UserStatus.OFFLINE,
				unavailable: UserStatus.AWAY,
			};

			const status = statusMap[data.presence] || UserStatus.OFFLINE;
			await Users.updateOne(
				{ _id: user._id },
				{
					$set: {
						status,
						statusDefault: status,
					},
				},
			);

			const { _id, username, statusText, roles, name } = user;
			void api.broadcast('federation-matrix.user.presence.status', {
				user: { status, _id, username, statusText, roles, name },
			});
			logger.debug(`Updated presence for user ${matrixUser.uid} to ${status} from Matrix federation`);
		} catch (error) {
			logger.error('Error handling Matrix presence event:', error);
		}
	});
};
