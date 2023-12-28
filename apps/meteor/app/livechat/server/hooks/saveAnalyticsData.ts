import { isEditedMessage, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		// check if room is livechat
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isEditedMessage(message)) {
			return message;
		}

		// if the message has a token, it was sent by the visitor
		if (message.token) {
			// When visitor sends a mesage, most metrics wont be calculated/served.
			// But, v.lq (last query) will be updated to the message time. This has to be done
			// As not doing it will cause the metrics to be crazy and not have real values.
			await LivechatRooms.saveAnalyticsDataByRoomId(room, message);
			return message;
		}

		if (message.file) {
			message = { ...(await normalizeMessageFileUpload(message)), ...{ _updatedAt: message._updatedAt } };
		}

		const now = new Date();
		let analyticsData;

		const visitorLastQuery = room.metrics?.v ? room.metrics.v.lq : room.ts;
		const agentLastReply = room.metrics?.servedBy ? room.metrics.servedBy.lr : room.ts;
		const agentJoinTime = room.servedBy?.ts ? room.servedBy.ts : room.ts;

		const isResponseTt = room.metrics?.response?.tt;
		const isResponseTotal = room.metrics?.response?.total;

		if (agentLastReply === room.ts) {
			// first response
			const firstResponseDate = now;
			const firstResponseTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;
			const responseTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;
			const avgResponseTime =
				((isResponseTt ? room.metrics?.response?.tt : 0) || 0 + responseTime) /
				((isResponseTotal ? room.metrics?.response?.total : 0) || 0 + 1);

			const firstReactionDate = now;
			const firstReactionTime = (now.getTime() - new Date(agentJoinTime).getTime()) / 1000;
			const reactionTime = (now.getTime() - new Date(agentJoinTime).getTime()) / 1000;

			analyticsData = {
				firstResponseDate,
				firstResponseTime,
				responseTime,
				avgResponseTime,
				firstReactionDate,
				firstReactionTime,
				reactionTime,
			};
		} else if (visitorLastQuery > agentLastReply) {
			// response, not first
			const responseTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;
			const avgResponseTime =
				((isResponseTt ? room.metrics?.response?.tt : 0) || 0 + responseTime) /
				((isResponseTotal ? room.metrics?.response?.total : 0) || 0 + 1);

			const reactionTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;

			analyticsData = {
				responseTime,
				avgResponseTime,
				reactionTime,
			};
		} // ignore, its continuing response

		await LivechatRooms.saveAnalyticsDataByRoomId(room, message, analyticsData);
		return message;
	},
	callbacks.priority.LOW,
	'saveAnalyticsData',
);
