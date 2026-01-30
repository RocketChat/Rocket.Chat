import { LivechatRooms, LivechatAgentActivity } from '@rocket.chat/models';

type Params = {
	start: Date;
	end: Date;
	options?: any;
};

export const findAllAverageServiceTimeAsync = async ({ start, end, options = {} }: Params) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllAverageServiceTimeByAgents({
		start,
		end,
		onlyCount: true,
	}).toArray();
	return {
		agents: await LivechatRooms.findAllAverageServiceTimeByAgents({
			start,
			end,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllServiceTimeAsync = async ({ start, end, options = {} }: Params) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllServiceTimeByAgent({
		start,
		end,
		onlyCount: true,
	}).toArray();
	return {
		agents: await LivechatRooms.findAllServiceTimeByAgent({ start, end, options }).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAvailableServiceTimeHistoryAsync = async ({
	start,
	end,
	fullReport,
	options = {},
}: {
	start: string;
	end: string;
	fullReport: boolean;
	options: { sort?: Record<string, number>; offset?: number; count?: number };
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatAgentActivity.findAvailableServiceTimeHistory({
		start,
		end,
		fullReport,
		onlyCount: true,
	}).toArray();
	return {
		agents: await LivechatAgentActivity.findAvailableServiceTimeHistory({
			start,
			end,
			fullReport,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};
