import { LivechatRooms, Messages } from '@rocket.chat/models';

import { settings } from '../../../../settings/server';

type Params = {
	start: Date;
	end: Date;
	options?: any;
	departmentId?: string;
};

export const findAllRoomsAsync = async ({ start, end, answered, departmentId, options = {} }: Params & { answered?: boolean }) => {
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

export const findAllAverageOfChatDurationTimeAsync = async ({ start, end, departmentId, options = {} }: Params) => {
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

export const findAllAverageServiceTimeAsync = async ({ start, end, departmentId, options = {} }: Params) => {
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

export const findAllServiceTimeAsync = async ({ start, end, departmentId, options = {} }: Params) => {
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

export const findAllAverageWaitingTimeAsync = async ({ start, end, departmentId, options = {} }: Params) => {
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

export const findAllNumberOfTransferredRoomsAsync = async ({ start, end, departmentId, options = {} }: Params) => {
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

export const findAllNumberOfAbandonedRoomsAsync = async ({ start, end, departmentId, options = {} }: Params) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await (
		await LivechatRooms.findAllNumberOfAbandonedRooms({
			start,
			end,
			departmentId,
			inactivityTimeout: settings.get('Livechat_visitor_inactivity_timeout'),
			onlyCount: true,
		})
	).toArray();
	return {
		departments: await (
			await LivechatRooms.findAllNumberOfAbandonedRooms({
				start,
				end,
				departmentId,
				inactivityTimeout: settings.get('Livechat_visitor_inactivity_timeout'),
				options,
			})
		).toArray(),
		total: total.length ? total[0].total : 0,
	};
};

export const findPercentageOfAbandonedRoomsAsync = async ({ start, end, departmentId, options = {} }: Params) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const total = await (
		await LivechatRooms.findPercentageOfAbandonedRooms({
			start,
			end,
			departmentId,
			inactivityTimeout: settings.get('Livechat_visitor_inactivity_timeout'),
			onlyCount: true,
		})
	).toArray();
	return {
		departments: await (
			await LivechatRooms.findPercentageOfAbandonedRooms({
				start,
				end,
				departmentId,
				inactivityTimeout: settings.get('Livechat_visitor_inactivity_timeout'),
				options,
			})
		).toArray(),
		total: total.length ? total[0].total : 0,
	};
};
