import { LivechatDepartment, LivechatRooms } from '../../../../models/server/raw';

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
		departments: await LivechatDepartment.findAllRooms({ start, answered, end, departmentId, options }),
		total: (await LivechatDepartment.findAllRooms({ start, answered, end, departmentId })).length,
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
		departments: await LivechatDepartment.findAllAverageServiceTime({ start, end, departmentId, options }),
		total: (await LivechatDepartment.findAllAverageServiceTime({ start, end, departmentId })).length,
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
		departments: await LivechatDepartment.findAllServiceTime({ start, end, departmentId, options }),
		total: (await LivechatDepartment.findAllServiceTime({ start, end, departmentId })).length,
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
		departments: await LivechatDepartment.findAllAverageWaitingTime({ start, end, departmentId, options }),
		total: (await LivechatDepartment.findAllAverageWaitingTime({ start, end, departmentId })).length,
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
		departments: await LivechatDepartment.findAllNumberOfTransferredRooms({ start, end, departmentId, options }),
		total: (await LivechatDepartment.findAllNumberOfTransferredRooms({ start, end, departmentId })).length,
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
		departments: await LivechatDepartment.findPercentageOfAbandonedRooms({ start, end, departmentId, options }),
		total: (await LivechatDepartment.findPercentageOfAbandonedRooms({ start, end, departmentId })).length,
	};
};

export const findAllAverageServiceTime = ({ start, end, departmentId, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, departmentId, options }));
export const findAllRooms = ({ start, end, answered, departmentId, options }) => Promise.await(findAllRoomsAsync({ start, end, answered, departmentId, options }));
export const findAllServiceTime = ({ start, end, departmentId, options }) => Promise.await(findAllServiceTimeAsync({ start, end, departmentId, options }));
export const findAllAverageWaitingTime = ({ start, end, departmentId, options }) => Promise.await(findAllAverageWaitingTimeAsync({ start, end, departmentId, options }));
export const findAllNumberOfTransferredRooms = ({ start, end, departmentId, options }) => Promise.await(findAllNumberOfTransferredRoomsAsync({ start, end, departmentId, options }));
export const findAllNumberOfAbandonedRooms = ({ start, end, departmentId, options }) => Promise.await(findAllNumberOfAbandonedRoomsAsync({ start, end, departmentId, options }));
export const findPercentageOfAbandonedRooms = ({ start, end, departmentId, options }) => Promise.await(findPercentageOfAbandonedRoomsAsync({ start, end, departmentId, options }));
