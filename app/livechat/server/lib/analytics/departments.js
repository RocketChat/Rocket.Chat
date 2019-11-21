import { LivechatRooms } from '../../../../models/server/raw';
import { Livechat } from '../Livechat';
import { secondsToHHMMSS } from '../../../../utils/server';

const findAllRoomsAsync = async ({
	start,
	end,
	answered,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllRooms({ start, answered, end, departmentId, options }),
		total: (await LivechatRooms.findAllRooms({ start, answered, end, departmentId })).length,
	};
};

const findAllAverageServiceTimeAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllAverageServiceTime({ start, end, departmentId, options }),
		total: (await LivechatRooms.findAllAverageServiceTime({ start, end, departmentId })).length,
	};
};

const findAllServiceTimeAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllServiceTime({ start, end, departmentId, options }),
		total: (await LivechatRooms.findAllServiceTime({ start, end, departmentId })).length,
	};
};

const findAllAverageWaitingTimeAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllAverageWaitingTime({ start, end, departmentId, options }),
		total: (await LivechatRooms.findAllAverageWaitingTime({ start, end, departmentId })).length,
	};
};

const findAllNumberOfTransferredRoomsAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllNumberOfTransferredRooms({ start, end, departmentId, options }),
		total: (await LivechatRooms.findAllNumberOfTransferredRooms({ start, end, departmentId })).length,
	};
};

const findAllNumberOfAbandonedRoomsAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findAllNumberOfAbandonedRooms({ start, end, departmentId, options }),
		total: (await LivechatRooms.findAllNumberOfAbandonedRooms({ start, end, departmentId })).length,
	};
};

const findPercentageOfAbandonedRoomsAsync = async ({
	start,
	end,
	departmentId,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatRooms.findPercentageOfAbandonedRooms({ start, end, departmentId, options }),
		total: (await LivechatRooms.findPercentageOfAbandonedRooms({ start, end, departmentId })).length,
	};
};

const findAllChatsStatusAsync = async ({
	start,
	end,
	departmentId,
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
	});
	const averageServiceTime = await findAllAverageServiceTimeAsync({
		start,
		end,
	});
	const averageWaitingTime = await findAllAverageWaitingTimeAsync({
		start,
		end,
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
	});
	const totalAbandonedRooms = abandonedRooms.departments.reduce((acc, item) => {
		acc += item.abandonedRooms;
		return acc;
	}, 0);
	return {
		totalizers: [...totalizers.filter((metric) => metrics.includes(metric.title)), { title: 'Total_abandoned_chats', value: totalAbandonedRooms }],
	};
};

const findAllChatMetricsByAgentAsync = async ({
	start,
	end,
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const open = await LivechatRooms.countAllOpenChatsByAgentBetweenDate({ start, end });
	const closed = await LivechatRooms.countAllClosedChatsByAgentBetweenDate({ start, end });
	const result = {};
	(open || []).forEach((agent) => {
		result[agent._id] = { open: agent.chats };
	});
	(closed || []).forEach((agent) => {
		result[agent._id] = { open: result[agent._id] ? result[agent._id].open : 0, closed: agent.chats };
	});
	return result;
};

export const findAllAverageServiceTime = ({ start, end, departmentId, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, departmentId, options }));
export const findAllRooms = ({ start, end, answered, departmentId, options }) => Promise.await(findAllRoomsAsync({ start, end, answered, departmentId, options }));
export const findAllServiceTime = ({ start, end, departmentId, options }) => Promise.await(findAllServiceTimeAsync({ start, end, departmentId, options }));
export const findAllAverageWaitingTime = ({ start, end, departmentId, options }) => Promise.await(findAllAverageWaitingTimeAsync({ start, end, departmentId, options }));
export const findAllNumberOfTransferredRooms = ({ start, end, departmentId, options }) => Promise.await(findAllNumberOfTransferredRoomsAsync({ start, end, departmentId, options }));
export const findAllNumberOfAbandonedRooms = ({ start, end, departmentId, options }) => Promise.await(findAllNumberOfAbandonedRoomsAsync({ start, end, departmentId, options }));
export const findPercentageOfAbandonedRooms = ({ start, end, departmentId, options }) => Promise.await(findPercentageOfAbandonedRoomsAsync({ start, end, departmentId, options }));
export const findAllChatsStatus = ({ start, end, departmentId }) => Promise.await(findAllChatsStatusAsync({ start, end, departmentId }));
export const getProductivityMetrics = ({ start, end, departmentId }) => Promise.await(getProductivityMetricsAsync({ start, end, departmentId }));
export const getConversationsMetrics = ({ start, end, departmentId }) => Promise.await(getConversationsMetricsAsync({ start, end, departmentId }));
export const findAllChatMetricsByAgent = ({ start, end, departmentId }) => Promise.await(findAllChatMetricsByAgentAsync({ start, end, departmentId }));
