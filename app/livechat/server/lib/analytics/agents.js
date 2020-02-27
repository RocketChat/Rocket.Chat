import { LivechatRooms, LivechatAgentActivity } from '../../../../models/server/raw';

const findAllAverageServiceTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		agents: await LivechatRooms.findAllAverageServiceTimeByAgents({ start, end, options }),
		total: (await LivechatRooms.findAllAverageServiceTimeByAgents({ start, end })).length,
	};
};

const findAllServiceTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		agents: await LivechatRooms.findAllServiceTimeByAgent({ start, end, options }),
		total: (await LivechatRooms.findAllServiceTimeByAgent({ start, end })).length,
	};
};

const findAvailableServiceTimeHistoryAsync = async ({
	start,
	end,
	fullReport,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		agents: await LivechatAgentActivity.findAvailableServiceTimeHistory({ start, end, fullReport, options }),
		total: (await LivechatAgentActivity.findAvailableServiceTimeHistory({ start, end, fullReport })).length,
	};
};

export const findAllAverageServiceTime = ({ start, end, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, options }));
export const findAllServiceTime = ({ start, end, options }) => Promise.await(findAllServiceTimeAsync({ start, end, options }));
export const findAvailableServiceTimeHistory = ({ start, end, fullReport, options }) => Promise.await(findAvailableServiceTimeHistoryAsync({ start, end, fullReport, options }));
