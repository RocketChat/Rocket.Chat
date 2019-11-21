import { LivechatRooms, Users, LivechatVisitors } from '../../../../models/server/raw';
import { Livechat } from '../Livechat';
import { secondsToHHMMSS } from '../../../../utils/server';
import {
	findPercentageOfAbandonedRoomsAsync,
	findAllAverageServiceTimeAsync,
	findAllAverageWaitingTimeAsync,
	findAllNumberOfAbandonedRoomsAsync,
} from './departments';


const findAllChatsStatusAsync = async ({
	start,
	end,
	departmentId = undefined,
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		open: await LivechatRooms.countAllOpenChatsBetweenDate({ start, end, departmentId }),
		closed: await LivechatRooms.countAllClosedChatsBetweenDate({ start, end, departmentId }),
		queued: await LivechatRooms.countAllQueuedChatsBetweenDate({ start, end, departmentId }),
	};
};

const getProductivityMetricsAsync = async ({
	start,
	end,
	departmentId = undefined,
}) => {
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
	});

	const averageOfAbandonedRooms = await findPercentageOfAbandonedRoomsAsync({
		start,
		end,
		departmentId,
	});
	const averageServiceTime = await findAllAverageServiceTimeAsync({
		start,
		end,
		departmentId,
	});
	const averageWaitingTime = await findAllAverageWaitingTimeAsync({
		start,
		end,
		departmentId,
	});
	const totalOfAbandonedRooms = averageOfAbandonedRooms.departments.length;
	const totalOfServiceTime = averageServiceTime.departments.length;
	const totalOfWaitingTime = averageWaitingTime.departments.length;
	const sumOfPercentageOfAbandonedRooms = averageOfAbandonedRooms.departments.reduce((acc, abandonedRoom) => {
		acc += abandonedRoom.percentageOfAbandonedChats;
		return acc;
	}, 0);
	const sumOfServiceTime = averageServiceTime.departments.reduce((acc, serviceTime) => {
		acc += serviceTime.averageServiceTimeInSeconds;
		return acc;
	}, 0);
	const sumOfWaitingTime = averageWaitingTime.departments.reduce((acc, serviceTime) => {
		acc += serviceTime.averageWaitingTimeInSeconds;
		return acc;
	}, 0);
	const totalOfAverageAbandonedRooms = totalOfAbandonedRooms === 0 ? 0 : sumOfPercentageOfAbandonedRooms / totalOfAbandonedRooms;
	const totalOfAverageServiceTime = totalOfServiceTime === 0 ? 0 : sumOfServiceTime / totalOfServiceTime;
	const totalOfAvarageWaitingTime = totalOfWaitingTime === 0 ? 0 : sumOfWaitingTime / totalOfWaitingTime;

	return {
		totalizers: [
			...totalizers,
			{ title: 'Avg_of_abandoned_chats', value: `${ totalOfAverageAbandonedRooms }%` },
			{ title: 'Avg_of_service_time', value: secondsToHHMMSS(totalOfAverageServiceTime) },
			{ title: 'Avg_of_waiting_time', value: secondsToHHMMSS(totalOfAvarageWaitingTime) },
		],
	};
};

const getConversationsMetricsAsync = async ({
	start,
	end,
	departmentId = undefined,
}) => {
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
	});
	const metrics = ['Total_conversations', 'Open_conversations', 'Total_messages', 'Busiest_time'];
	const abandonedRooms = await findAllNumberOfAbandonedRoomsAsync({
		start,
		end,
		departmentId,
	});
	const visitorsCount = await LivechatVisitors.getVisitorsBetweenDate({ start, end }).count();
	const totalAbandonedRooms = abandonedRooms.departments.reduce((acc, item) => {
		acc += item.abandonedRooms;
		return acc;
	}, 0);
	return {
		totalizers: [
			...totalizers.filter((metric) => metrics.includes(metric.title)),
			{ title: 'Total_abandoned_chats', value: totalAbandonedRooms },
			{ title: 'Total_visitors', value: visitorsCount },
		],
	};
};

const findAllChatMetricsByAgentAsync = async ({
	start,
	end,
	departmentId = undefined,
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const open = await LivechatRooms.countAllOpenChatsByAgentBetweenDate({ start, end, departmentId });
	const closed = await LivechatRooms.countAllClosedChatsByAgentBetweenDate({ start, end, departmentId });
	const result = {};
	(open || []).forEach((agent) => {
		result[agent._id] = { open: agent.chats, closed: 0 };
	});
	(closed || []).forEach((agent) => {
		result[agent._id] = { open: result[agent._id] ? result[agent._id].open : 0, closed: agent.chats };
	});
	return result;
};

const findAllAgentsStatusAsync = async ({ departmentId = undefined }) => (await Users.countAllAgentsStatus({ departmentId }))[0];

const findAllChatMetricsByDepartmentAsync = async ({
	start,
	end,
	departmentId = undefined,
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const open = await LivechatRooms.countAllOpenChatsByDepartmentBetweenDate({ start, end, departmentId });
	const closed = await LivechatRooms.countAllClosedChatsByDepartmentBetweenDate({ start, end, departmentId });
	const result = {};
	(open || []).forEach((department) => {
		result[department.name] = { open: department.chats, closed: 0 };
	});
	(closed || []).forEach((department) => {
		result[department.name] = { open: result[department.name] ? result[department.name].open : 0, closed: department.chats };
	});
	return result;
};

export const findAllChatsStatus = ({ start, end, departmentId = undefined }) => Promise.await(findAllChatsStatusAsync({ start, end, departmentId }));
export const getProductivityMetrics = ({ start, end, departmentId = undefined }) => Promise.await(getProductivityMetricsAsync({ start, end, departmentId }));
export const getConversationsMetrics = ({ start, end, departmentId = undefined }) => Promise.await(getConversationsMetricsAsync({ start, end, departmentId }));
export const findAllChatMetricsByAgent = ({ start, end, departmentId = undefined }) => Promise.await(findAllChatMetricsByAgentAsync({ start, end, departmentId }));
export const findAllChatMetricsByDepartment = ({ start, end, departmentId = undefined }) => Promise.await(findAllChatMetricsByDepartmentAsync({ start, end, departmentId }));
export const findAllAgentsStatus = ({ departmentId = undefined }) => Promise.await(findAllAgentsStatusAsync({ departmentId }));
