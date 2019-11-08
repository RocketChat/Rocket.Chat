import { LivechatDepartment } from '../../../../models/server/raw';

const findAllRoomsAsync = async ({
	start,
	end,
	answered,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findAllRooms({ start, answered, end, options }),
		total: (await LivechatDepartment.findAllRooms({ start, answered, end })).length,
	};
};

const findAllAverageServiceTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findAllAverageServiceTime({ start, end, options }),
		total: (await LivechatDepartment.findAllAverageServiceTime({ start, end })).length,
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
		departments: await LivechatDepartment.findAllServiceTime({ start, end, options }),
		total: (await LivechatDepartment.findAllServiceTime({ start, end })).length,
	};
};

const findAllAverageWaitingTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findAllAverageWaitingTime({ start, end, options }),
		total: (await LivechatDepartment.findAllAverageWaitingTime({ start, end })).length,
	};
};

const findAllNumberOfTransferedRoomsAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findAllNumberOfTransferedRooms({ start, end, options }),
		total: (await LivechatDepartment.findAllNumberOfTransferedRooms({ start, end })).length,
	};
};

const findAllNumberOfAbandonedRoomsAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findAllNumberOfAbandonedRooms({ start, end, options }),
		total: (await LivechatDepartment.findAllNumberOfAbandonedRooms({ start, end })).length,
	};
};

const findPercentageOfAbandonedRoomsAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	return {
		departments: await LivechatDepartment.findPercentageOfAbandonedRooms({ start, end, options }),
		total: (await LivechatDepartment.findPercentageOfAbandonedRooms({ start, end })).length,
	};
};

export const findAllAverageServiceTime = ({ start, end, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, options }));
export const findAllRooms = ({ start, end, answered, options }) => Promise.await(findAllRoomsAsync({ start, end, answered, options }));
export const findAllServiceTime = ({ start, end, options }) => Promise.await(findAllServiceTimeAsync({ start, end, options }));
export const findAllAverageWaitingTime = ({ start, end, options }) => Promise.await(findAllAverageWaitingTimeAsync({ start, end, options }));
export const findAllNumberOfTransferedRooms = ({ start, end, options }) => Promise.await(findAllNumberOfTransferedRoomsAsync({ start, end, options }));
export const findAllNumberOfAbandonedRooms = ({ start, end, options }) => Promise.await(findAllNumberOfAbandonedRoomsAsync({ start, end, options }));
export const findPercentageOfAbandonedRooms = ({ start, end, options }) => Promise.await(findPercentageOfAbandonedRoomsAsync({ start, end, options }));
