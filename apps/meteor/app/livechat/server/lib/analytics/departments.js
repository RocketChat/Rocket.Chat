import { LivechatRooms, Messages } from '../../../../models/server/raw';

export const findAllRoomsAsync = async ({ start, end, answered, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllRooms({
		start,
		answered,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await LivechatRooms.findAllRooms({
			start,
			answered,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllAverageOfChatDurationTimeAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllAverageOfChatDurationTime({
		start,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await LivechatRooms.findAllAverageOfChatDurationTime({
			start,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllAverageServiceTimeAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllAverageOfServiceTime({
		start,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await LivechatRooms.findAllAverageOfServiceTime({
			start,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllServiceTimeAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllServiceTime({
		start,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await LivechatRooms.findAllServiceTime({
			start,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllAverageWaitingTimeAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await LivechatRooms.findAllAverageWaitingTime({
		start,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await LivechatRooms.findAllAverageWaitingTime({
			start,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllNumberOfTransferredRoomsAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await Messages.findAllNumberOfTransferredRooms({
		start,
		end,
		departmentId,
		onlyCount: true,
	}).toArray();
	return {
		departments: await Messages.findAllNumberOfTransferredRooms({
			start,
			end,
			departmentId,
			options,
		}).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllNumberOfAbandonedRoomsAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await (await LivechatRooms.findAllNumberOfAbandonedRooms({ start, end, departmentId, onlyCount: true })).toArray();
	return {
		departments: await (await LivechatRooms.findAllNumberOfAbandonedRooms({ start, end, departmentId, options })).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findPercentageOfAbandonedRoomsAsync = async ({ start, end, departmentId, options = {} }) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await (
		await LivechatRooms.findPercentageOfAbandonedRooms({
			start,
			end,
			departmentId,
			onlyCount: true,
		})
	).toArray();
	return {
		departments: await (await LivechatRooms.findPercentageOfAbandonedRooms({ start, end, departmentId, options })).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findAllAverageOfChatDurationTime = ({ start, end, departmentId, options }) =>
	Promise.await(findAllAverageOfChatDurationTimeAsync({ start, end, departmentId, options }));
export const findAllAverageServiceTime = ({ start, end, departmentId, options }) =>
	Promise.await(findAllAverageServiceTimeAsync({ start, end, departmentId, options }));
export const findAllRooms = ({ start, end, answered, departmentId, options }) =>
	Promise.await(findAllRoomsAsync({ start, end, answered, departmentId, options }));
export const findAllServiceTime = ({ start, end, departmentId, options }) =>
	Promise.await(findAllServiceTimeAsync({ start, end, departmentId, options }));
export const findAllAverageWaitingTime = ({ start, end, departmentId, options }) =>
	Promise.await(findAllAverageWaitingTimeAsync({ start, end, departmentId, options }));
export const findAllNumberOfTransferredRooms = ({ start, end, departmentId, options }) =>
	Promise.await(findAllNumberOfTransferredRoomsAsync({ start, end, departmentId, options }));
export const findAllNumberOfAbandonedRooms = ({ start, end, departmentId, options }) =>
	Promise.await(findAllNumberOfAbandonedRoomsAsync({ start, end, departmentId, options }));
export const findPercentageOfAbandonedRooms = ({ start, end, departmentId, options }) =>
	Promise.await(findPercentageOfAbandonedRoomsAsync({ start, end, departmentId, options }));
