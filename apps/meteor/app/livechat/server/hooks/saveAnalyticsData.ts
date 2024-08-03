import { isEditedMessage } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';

const getMetricValue = <T>(metric: T | undefined, defaultValue: T): T => metric ?? defaultValue;
const calculateTimeDifference = <T extends Date | number>(startTime: T, now: Date): number =>
	(now.getTime() - new Date(startTime).getTime()) / 1000;
const calculateAvgResponseTime = (totalResponseTime: number, newResponseTime: number, responseCount: number) =>
	(totalResponseTime + newResponseTime) / (responseCount + 1);

const getFirstResponseAnalytics = (
	visitorLastQuery: Date,
	agentJoinTime: Date,
	totalResponseTime: number,
	responseCount: number,
	now: Date,
) => {
	const responseTime = calculateTimeDifference(visitorLastQuery, now);
	const reactionTime = calculateTimeDifference(agentJoinTime, now);
	const avgResponseTime = calculateAvgResponseTime(totalResponseTime, responseTime, responseCount);

	return {
		firstResponseDate: now,
		firstResponseTime: responseTime,
		responseTime,
		avgResponseTime,
		firstReactionDate: now,
		firstReactionTime: reactionTime,
		reactionTime,
	};
};

const getSubsequentResponseAnalytics = (visitorLastQuery: Date, totalResponseTime: number, responseCount: number, now: Date) => {
	const responseTime = calculateTimeDifference(visitorLastQuery, now);
	const avgResponseTime = calculateAvgResponseTime(totalResponseTime, responseTime, responseCount);

	return {
		responseTime,
		avgResponseTime,
		reactionTime: responseTime,
	};
};

const getAnalyticsData = (room: IOmnichannelRoom, now: Date): Record<string, string | number | Date> | undefined => {
	const visitorLastQuery = getMetricValue(room.metrics?.v?.lq, room.ts);
	const agentLastReply = getMetricValue(room.metrics?.servedBy?.lr, room.ts);
	const agentJoinTime = getMetricValue(room.servedBy?.ts, room.ts);
	const totalResponseTime = getMetricValue(room.metrics?.response?.tt, 0);
	const responseCount = getMetricValue(room.metrics?.response?.total, 0);

	if (agentLastReply === room.ts) {
		return getFirstResponseAnalytics(visitorLastQuery, agentJoinTime, totalResponseTime, responseCount, now);
	}
	if (visitorLastQuery > agentLastReply) {
		return getSubsequentResponseAnalytics(visitorLastQuery, totalResponseTime, responseCount, now);
	}
};

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (!message || isEditedMessage(message)) {
			return message;
		}

		if (message.file) {
			message = { ...(await normalizeMessageFileUpload(message)), ...{ _updatedAt: message._updatedAt } };
		}

		const analyticsData = getAnalyticsData(room, new Date());
		const updater = await LivechatRooms.getAnalyticsUpdateQueryByRoomId(room, message, analyticsData);

		if (updater.hasChanges()) {
			await updater.persist({
				_id: room._id,
			});
		}

		return message;
	},
	callbacks.priority.LOW,
	'saveAnalyticsData',
);
