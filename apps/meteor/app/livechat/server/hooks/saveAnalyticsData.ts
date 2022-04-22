import { IRoom, isOmnichannelRoom, IMessage, isEditedMessage, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isEditedMessage(message)) {
			return message;
		}

		if (message.file) {
			message = Promise.await(normalizeMessageFileUpload(message));
		}

		const now = new Date();
		let analyticsData;

		// if the message has a token, it was sent by the visitor
		if (!(message as IOmnichannelMessage).token) {
			const visitorLastQuery = room.metrics && room.metrics.v ? room.metrics.v.lq : room.ts;
			const agentLastReply = room.metrics && room.metrics.servedBy ? room.metrics.servedBy.lr : room.ts;
			const agentJoinTime = room.servedBy && room.servedBy.ts ? room.servedBy.ts : room.ts;

			const isResponseTt = room.metrics && room.metrics.response && room.metrics.response.tt;
			const isResponseTotal = room.metrics && room.metrics.response && room.metrics.response.total;

			if (agentLastReply === room.ts) {
				// first response
				const firstResponseDate = now;
				const firstResponseTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;
				const responseTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;
				const avgResponseTime =
					((isResponseTt ? room.metrics.response.tt : 0) + responseTime) / ((isResponseTotal ? room.metrics.response.total : 0) + 1);

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
					((isResponseTt ? room.metrics.response.tt : 0) + responseTime) / ((isResponseTotal ? room.metrics.response.total : 0) + 1);

				const reactionTime = (now.getTime() - new Date(visitorLastQuery).getTime()) / 1000;

				analyticsData = {
					responseTime,
					avgResponseTime,
					reactionTime,
				};
			} // ignore, its continuing response
		}

		LivechatRooms.saveAnalyticsDataByRoomId(room, message, analyticsData);
		return message;
	},
	callbacks.priority.LOW,
	'saveAnalyticsData',
);
