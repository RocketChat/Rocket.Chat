import moment from 'moment';

import { LivechatRooms, Users, LivechatVisitors, LivechatAgentActivity } from '../../../../models/server/raw';
import { settings } from '../../../../settings';
import { Livechat } from '../Livechat';
import { secondsToHHMMSS } from '../../../../utils/server';
import {
	findPercentageOfAbandonedRoomsAsync,
	findAllAverageOfChatDurationTimeAsync,
	findAllAverageWaitingTimeAsync,
	findAllNumberOfAbandonedRoomsAsync,
	findAllAverageServiceTimeAsync,
} from './departments';

const findAllChatsStatusAsync = async ({ start, end, departmentId = undefined }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		open: await LivechatRooms.countAllOpenChatsBetweenDate({ start, end, departmentId }),
		closed: await LivechatRooms.countAllClosedChatsBetweenDate({ start, end, departmentId }),
		queued: await LivechatRooms.countAllQueuedChatsBetweenDate({ start, end, departmentId }),
		onhold: await LivechatRooms.getOnHoldConversationsBetweenDate(start, end, departmentId),
	};
};

const getProductivityMetricsAsync = async ({ start, end, departmentId = undefined, user = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const totalizers = Livechat.Analytics.getAnalyticsOverviewData({
		daterange: {
			from: start,
			to: end,
		},
		analyticsOptions: {
			name: 'Productivity',
		},
		departmentId,
		utcOffset: user.utcOffset,
		language: user.language || settings.get('Language') || 'en',
	});
	const averageWaitingTime = await findAllAverageWaitingTimeAsync({
		start,
		end,
		departmentId,
	});

	const totalOfWaitingTime = averageWaitingTime.departments.length;

	const sumOfWaitingTime = averageWaitingTime.departments.reduce((acc, serviceTime) => {
		acc += serviceTime.averageWaitingTimeInSeconds;
		return acc;
	}, 0);
	const totalOfAvarageWaitingTime = totalOfWaitingTime === 0 ? 0 : sumOfWaitingTime / totalOfWaitingTime;

	return {
		totalizers: [...totalizers, { title: 'Avg_of_waiting_time', value: secondsToHHMMSS(totalOfAvarageWaitingTime) }],
	};
};

const getAgentsProductivityMetricsAsync = async ({ start, end, departmentId = undefined, user = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const averageOfAvailableServiceTime = (
		await LivechatAgentActivity.findAllAverageAvailableServiceTime({
			date: parseInt(moment(start).format('YYYYMMDD')),
			departmentId,
		})
	)[0];
	const averageOfServiceTime = await findAllAverageServiceTimeAsync({
		start,
		end,
		departmentId,
	});
	const totalizers = Livechat.Analytics.getAnalyticsOverviewData({
		daterange: {
			from: start,
			to: end,
		},
		analyticsOptions: {
			name: 'Conversations',
		},
		departmentId,
		utcOffset: user.utcOffset,
		language: user.language || settings.get('Language') || 'en',
	});

	const totalOfServiceTime = averageOfServiceTime.departments.length;

	const sumOfServiceTime = averageOfServiceTime.departments.reduce((acc, serviceTime) => {
		acc += serviceTime.averageServiceTimeInSeconds;
		return acc;
	}, 0);
	const totalOfAverageAvailableServiceTime = averageOfAvailableServiceTime
		? averageOfAvailableServiceTime.averageAvailableServiceTimeInSeconds
		: 0;
	const totalOfAverageServiceTime = totalOfServiceTime === 0 ? 0 : sumOfServiceTime / totalOfServiceTime;

	return {
		totalizers: [
			...totalizers.filter((metric) => metric.title === 'Busiest_time'),
			{
				title: 'Avg_of_available_service_time',
				value: secondsToHHMMSS(totalOfAverageAvailableServiceTime),
			},
			{ title: 'Avg_of_service_time', value: secondsToHHMMSS(totalOfAverageServiceTime) },
		],
	};
};

const getChatsMetricsAsync = async ({ start, end, departmentId = undefined }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const abandonedRooms = await findAllNumberOfAbandonedRoomsAsync({
		start,
		end,
		departmentId,
	});
	const averageOfAbandonedRooms = await findPercentageOfAbandonedRoomsAsync({
		start,
		end,
		departmentId,
	});
	const averageOfChatDurationTime = await findAllAverageOfChatDurationTimeAsync({
		start,
		end,
		departmentId,
	});

	const totalOfAbandonedRooms = averageOfAbandonedRooms.departments.length;
	const totalOfChatDurationTime = averageOfChatDurationTime.departments.length;

	const sumOfPercentageOfAbandonedRooms = averageOfAbandonedRooms.departments.reduce((acc, abandonedRoom) => {
		acc += abandonedRoom.percentageOfAbandonedChats;
		return acc;
	}, 0);
	const sumOfChatDurationTime = averageOfChatDurationTime.departments.reduce((acc, chatDurationTime) => {
		acc += chatDurationTime.averageChatDurationTimeInSeconds;
		return acc;
	}, 0);
	const totalAbandonedRooms = abandonedRooms.departments.reduce((acc, item) => {
		acc += item.abandonedRooms;
		return acc;
	}, 0);

	const totalOfAverageAbandonedRooms = totalOfAbandonedRooms === 0 ? 0 : sumOfPercentageOfAbandonedRooms / totalOfAbandonedRooms;
	const totalOfAverageChatDurationTime = totalOfChatDurationTime === 0 ? 0 : sumOfChatDurationTime / totalOfChatDurationTime;

	return {
		totalizers: [
			{ title: 'Total_abandoned_chats', value: totalAbandonedRooms },
			{ title: 'Avg_of_abandoned_chats', value: `${totalOfAverageAbandonedRooms}%` },
			{
				title: 'Avg_of_chat_duration_time',
				value: secondsToHHMMSS(totalOfAverageChatDurationTime),
			},
		],
	};
};

const getConversationsMetricsAsync = async ({ start, end, departmentId, user = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const totalizers = Livechat.Analytics.getAnalyticsOverviewData({
		daterange: {
			from: start,
			to: end,
		},
		analyticsOptions: {
			name: 'Conversations',
		},
		...(departmentId && departmentId !== 'undefined' && { departmentId }),
		utcOffset: user.utcOffset,
		language: user.language || settings.get('Language') || 'en',
	});
	const metrics = ['Total_conversations', 'Open_conversations', 'On_Hold_conversations', 'Total_messages'];
	const visitorsCount = await LivechatVisitors.getVisitorsBetweenDate({
		start,
		end,
		department: departmentId,
	}).count();
	return {
		totalizers: [...totalizers.filter((metric) => metrics.includes(metric.title)), { title: 'Total_visitors', value: visitorsCount }],
	};
};

const findAllChatMetricsByAgentAsync = async ({ start, end, departmentId = undefined }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const open = await LivechatRooms.countAllOpenChatsByAgentBetweenDate({
		start,
		end,
		departmentId,
	});
	const closed = await LivechatRooms.countAllClosedChatsByAgentBetweenDate({
		start,
		end,
		departmentId,
	});
	const onhold = await LivechatRooms.countAllOnHoldChatsByAgentBetweenDate({
		start,
		end,
		departmentId,
	});
	const result = {};
	(open || []).forEach((agent) => {
		result[agent._id] = { open: agent.chats, closed: 0, onhold: 0 };
	});
	(closed || []).forEach((agent) => {
		result[agent._id] = {
			open: result[agent._id] ? result[agent._id].open : 0,
			closed: agent.chats,
		};
	});
	(onhold || []).forEach((agent) => {
		result[agent._id] = {
			...result[agent._id],
			onhold: agent.chats,
		};
	});
	return result;
};

const findAllAgentsStatusAsync = async ({ departmentId = undefined }) => (await Users.countAllAgentsStatus({ departmentId }))[0];

const findAllChatMetricsByDepartmentAsync = async ({ start, end, departmentId = undefined }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const open = await LivechatRooms.countAllOpenChatsByDepartmentBetweenDate({
		start,
		end,
		departmentId,
	});
	const closed = await LivechatRooms.countAllClosedChatsByDepartmentBetweenDate({
		start,
		end,
		departmentId,
	});
	const result = {};
	(open || []).forEach((department) => {
		result[department.name] = { open: department.chats, closed: 0 };
	});
	(closed || []).forEach((department) => {
		result[department.name] = {
			open: result[department.name] ? result[department.name].open : 0,
			closed: department.chats,
		};
	});
	return result;
};

const findAllResponseTimeMetricsAsync = async ({ start, end, departmentId = undefined }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const responseTimes = (await LivechatRooms.calculateResponseTimingsBetweenDates({ start, end, departmentId }))[0];
	const reactionTimes = (await LivechatRooms.calculateReactionTimingsBetweenDates({ start, end, departmentId }))[0];
	const durationTimings = (await LivechatRooms.calculateDurationTimingsBetweenDates({ start, end, departmentId }))[0];

	return {
		response: {
			avg: responseTimes ? responseTimes.avg : 0,
			longest: responseTimes ? responseTimes.longest : 0,
		},
		reaction: {
			avg: reactionTimes ? reactionTimes.avg : 0,
			longest: reactionTimes ? reactionTimes.longest : 0,
		},
		chatDuration: {
			avg: durationTimings ? durationTimings.avg : 0,
			longest: durationTimings ? durationTimings.longest : 0,
		},
	};
};

export const findAllChatsStatus = ({ start, end, departmentId = undefined }) =>
	Promise.await(findAllChatsStatusAsync({ start, end, departmentId }));
export const getProductivityMetrics = ({ start, end, departmentId = undefined, user = {} }) =>
	Promise.await(getProductivityMetricsAsync({ start, end, departmentId, user }));
export const getAgentsProductivityMetrics = ({ start, end, departmentId = undefined, user = {} }) =>
	Promise.await(getAgentsProductivityMetricsAsync({ start, end, departmentId, user }));
export const getConversationsMetrics = ({ start, end, departmentId = undefined, user = {} }) =>
	Promise.await(getConversationsMetricsAsync({ start, end, departmentId, user }));
export const findAllChatMetricsByAgent = ({ start, end, departmentId = undefined }) =>
	Promise.await(findAllChatMetricsByAgentAsync({ start, end, departmentId }));
export const findAllChatMetricsByDepartment = ({ start, end, departmentId = undefined }) =>
	Promise.await(findAllChatMetricsByDepartmentAsync({ start, end, departmentId }));
export const findAllResponseTimeMetrics = ({ start, end, departmentId = undefined }) =>
	Promise.await(findAllResponseTimeMetricsAsync({ start, end, departmentId }));
export const getChatsMetrics = ({ start, end, departmentId = undefined }) =>
	Promise.await(getChatsMetricsAsync({ start, end, departmentId }));
export const findAllAgentsStatus = ({ departmentId = undefined }) => Promise.await(findAllAgentsStatusAsync({ departmentId }));
