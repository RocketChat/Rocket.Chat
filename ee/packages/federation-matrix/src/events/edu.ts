import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:edu');

export const edus = async (emitter: Emitter<HomeserverEventSignatures>, eduProcessTypes: { typing: boolean; presence: boolean }) => {
	emitter.on('homeserver.matrix.typing', async (data) => {
		if (!eduProcessTypes.typing) {
			return;
		}

		try {
			const matrixRoom = await Rooms.findOne({ 'federation.mrid': data.room_id }, { projection: { _id: 1 } });
			if (!matrixRoom) {
				logger.debug(`No bridged room found for Matrix room_id: ${data.room_id}`);
				return;
			}

			const matrixUser = await Users.findOne({ 'federation.mui': data.user_id });
			if (!matrixUser?.username) {
				logger.debug(`No bridged user found for Matrix user_id: ${data.user_id}`);
				return;
			}

			void api.broadcast('user.activity', {
				user: matrixUser.username,
				isTyping: data.typing,
				roomId: matrixRoom._id,
			});
		} catch (error) {
			logger.error('Error handling Matrix typing event:', error);
		}
	});

	emitter.on('homeserver.matrix.presence', async (data) => {
		if (!eduProcessTypes.presence) {
			return;
		}

		try {
			const matrixUser = await Users.findOne({ 'federation.mui': data.user_id });
			if (!matrixUser) {
				logger.debug(`No bridged user found for Matrix user_id: ${data.user_id}`);
				return;
			}

			const statusMap = {
				online: UserStatus.ONLINE,
				offline: UserStatus.OFFLINE,
				unavailable: UserStatus.AWAY,
			};

			const status = statusMap[data.presence] || UserStatus.OFFLINE;
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
			logger.debug(`Updated presence for user ${matrixUser._id} to ${status} from Matrix federation`);
		} catch (error) {
			logger.error('Error handling Matrix presence event:', error);
		}
	});
};
