import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';
import { callbackLogger } from '../lib/callbackLogger';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		callbackLogger.debug(`Calculating Omnichannel metrics for room ${room._id}`);
		// check if room is livechat
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || message.editedAt) {
			return message;
		}

		// if the message has a token, it was sent by the visitor
		if (message.token) {
			// When visitor sends a mesage, most metrics wont be calculated/served.
			// But, v.lq (last query) will be updated to the message time. This has to be done
			// As not doing it will cause the metrics to be crazy and not have real values.
			LivechatRooms.saveAnalyticsDataByRoomId(room, message);
			return message;
		}

		if (message.file) {
			message = Promise.await(normalizeMessageFileUpload(message));
		}

		const now = new Date();
		let analyticsData;

		const visitorLastQuery = room.metrics && room.metrics.v ? room.metrics.v.lq : room.ts;
		const agentLastReply = room.metrics && room.metrics.servedBy ? room.metrics.servedBy.lr : room.ts;
		const agentJoinTime = room.servedBy && room.servedBy.ts ? room.servedBy.ts : room.ts;

		const isResponseTt = room.metrics && room.metrics.response && room.metrics.response.tt;
		const isResponseTotal = room.metrics && room.metrics.response && room.metrics.response.total;

		if (agentLastReply === room.ts) {
			callbackLogger.debug('Calculating: first message from agent');
			// first response
			const firstResponseDate = now;
			const firstResponseTime = (now.getTime() - visitorLastQuery) / 1000;
			const responseTime = (now.getTime() - visitorLastQuery) / 1000;
			const avgResponseTime =
				((isResponseTt ? room.metrics.response.tt : 0) + responseTime) / ((isResponseTotal ? room.metrics.response.total : 0) + 1);

			const firstReactionDate = now;
			const firstReactionTime = (now.getTime() - agentJoinTime) / 1000;
			const reactionTime = (now.getTime() - agentJoinTime) / 1000;

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
			callbackLogger.debug('Calculating: visitor sent a message after agent');
			// response, not first
			const responseTime = (now.getTime() - visitorLastQuery) / 1000;
			const avgResponseTime =
				((isResponseTt ? room.metrics.response.tt : 0) + responseTime) / ((isResponseTotal ? room.metrics.response.total : 0) + 1);

			const reactionTime = (now.getTime() - visitorLastQuery) / 1000;

			analyticsData = {
				responseTime,
				avgResponseTime,
				reactionTime,
			};
		} // ignore, its continuing response

		LivechatRooms.saveAnalyticsDataByRoomId(room, message, analyticsData);
		return message;
	},
	callbacks.priority.LOW,
	'saveAnalyticsData',
);
