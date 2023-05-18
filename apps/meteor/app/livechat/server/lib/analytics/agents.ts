import { LivechatRooms, LivechatAgentActivity } from '@rocket.chat/models';

type Period = {
	start: Date;
	end: Date;
};

export const findAllAverageServiceTimeAsync = async ({
	start,
	end,
	options = {},
}: Period & { options?: { offset?: number; count?: number } }) => {
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

export const findAllServiceTimeAsync = async ({ start, end, options = {} }: Period & { options?: { offset?: number; count?: number } }) => {
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
}: Period & {
	options: { offset?: number; count?: number };
	fullReport: boolean;
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatAgentActivity.findAvailableServiceTimeHistory({
		start,
		end,
		fullReport,
		onlyCount: true,
		options: {},
	}).toArray();
	return {
		agents: await LivechatAgentActivity.findAvailableServiceTimeHistory({
			start,
			end,
			fullReport,
			options,
			onlyCount: false,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};
