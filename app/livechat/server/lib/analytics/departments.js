import { settings } from '../../../../settings/server';
import { LivechatDepartment } from '../../../../models/server';

const findAllRoomsAsync = async ({
	start,
	end,
	answered,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	if (answered !== undefined) {
		roomsFilter.push({ [answered ? '$ne' : '$eq']: ['$$room.waitingResponse', true] });
	}
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const project = {
		$project: {
			name: 1,
			description: 1,
			enabled: 1,
			rooms: {
				$size: {
					$filter: {
						input: '$rooms',
						as: 'room',
						cond: {
							$and: roomsFilter,
						},
					},
				},
			},
		},
	};
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, project, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, project]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projects = [
		{
			$project: {
				department: '$$ROOT',
				rooms: {
					$filter: {
						input: '$rooms',
						as: 'room',
						cond: {
							$and: roomsFilter,
						},
					},
				},
			},
		},
		{
			$project: {
				department: '$department',
				chats: { $size: '$rooms' },
				chatsDuration: { $sum: '$rooms.metrics.chatDuration' },
			},
		},
		{
			$project: {
				name: '$department.name',
				description: '$department.description',
				enabled: '$department.enabled',
				averageServiceTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$chats', 0] }, 0, { $divide: ['$chatsDuration', '$chats'] }] } },
			},
		}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projects = [
		{
			$project: {
				department: '$$ROOT',
				rooms: {
					$filter: {
						input: '$rooms',
						as: 'room',
						cond: {
							$and: roomsFilter,
						},
					},
				},
			},
		},
		{
			$project: {
				name: '$department.name',
				description: '$department.description',
				enabled: '$department.enabled',
				chats: { $size: '$rooms' },
				chatsDuration: { $ceil: { $sum: '$rooms.metrics.chatDuration' } },
			},
		}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
		{ $ne: ['$$room.waitingResponse', true] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projects = [{
		$project: {
			department: '$$ROOT',
			rooms: {
				$filter: {
					input: '$rooms',
					as: 'room',
					cond: {
						$and: roomsFilter,
					},
				},
			},
		},
	},
	{
		$project: {
			department: '$department',
			chats: { $size: '$rooms' },
			chatsFirstResponses: { $sum: '$rooms.metrics.response.ft' },
		},
	},
	{
		$project: {
			name: '$department.name',
			description: '$department.description',
			enabled: '$department.enabled',
			averageWaitingTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$chats', 0] }, 0, { $divide: ['$chatsFirstResponses', '$chats'] }] } },
		},
	}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projectRooms = {
		$project: {
			department: '$$ROOT',
			rooms: {
				$filter: {
					input: '$rooms',
					as: 'room',
					cond: {
						$and: roomsFilter,
					},
				},
			},
		},
	};
	const projectTransfersSize = {
		$project: {
			department: '$department',
			transfers: { $size: { $ifNull: ['$rooms.transferHistory', []] } },
		},
	};
	const group = {
		$group: {
			_id: {
				departmentId: '$department._id',
				name: '$department.name',
				description: '$department.description',
				enabled: '$department.enabled',
			},
			numberOfTransferedRooms: { $sum: '$transfers' },
		},
	};
	const presentationProject = {
		$project: {
			_id: '$_id.departmentId',
			name: '$_id.name',
			description: '$_id.description',
			enabled: '$_id.enabled',
			numberOfTransferedRooms: 1,
		},
	};
	const unwind = {
		$unwind: {
			path: '$rooms',
			preserveNullAndEmptyArrays: true,
		},
	};
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, projectRooms, unwind, projectTransfersSize, group, presentationProject, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, projectRooms, unwind, projectTransfersSize, group, presentationProject]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
		{ $gte: ['$$room.metrics.visitorInactivity', settings.get('Livechat_visitor_inactivity')] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projects = [{
		$project: {
			department: '$$ROOT',
			rooms: {
				$filter: {
					input: '$rooms',
					as: 'room',
					cond: {
						$and: roomsFilter,
					},
				},
			},
		},
	},
	{
		$project: {
			name: '$department.name',
			description: '$department.description',
			enabled: '$department.enabled',
			abandonedRooms: { $size: '$rooms' },
		},
	}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, ...projects]).toArray()).length,
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
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'departmentId',
			as: 'rooms',
		},
	};
	const projectRooms = {
		$project: {
			department: '$$ROOT',
			rooms: {
				$filter: {
					input: '$rooms',
					as: 'room',
					cond: {
						$and: roomsFilter,
					},
				},
			},
		},
	};
	const unwind = {
		$unwind: {
			path: '$rooms',
			preserveNullAndEmptyArrays: true,
		},
	};
	const group = {
		$group: {
			_id: {
				departmentId: '$department._id',
				name: '$department.name',
				description: '$department.description',
				enabled: '$department.enabled',
			},
			abandonedChats: {
				$sum: {
					$cond: [{
						$and: [
							{ $ifNull: ['$rooms.metrics.visitorInactivity', false] },
							{ $gte: ['$rooms.metrics.visitorInactivity', 1] },
						],
					}, 1, 0],
				},
			},
			chats: { $sum: 1 },
		},
	};
	const presentationProject = {
		$project: {
			_id: '$_id.departmentId',
			name: '$_id.name',
			description: '$_id.description',
			enabled: '$_id.enabled',
			percentageOfAbandonedChats: {
				$floor: {
					$cond: [
						{ $eq: ['$chats', 0] },
						0,
						{ $divide: [{ $multiply: ['$abandonedChats', 100] }, '$chats'] },
					],
				},
			},
		},
	};
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { name: 1 } };
	return {
		departments: await LivechatDepartment.model.rawCollection().aggregate([lookup, projectRooms, unwind, group, presentationProject, sort, skip, limit]).toArray(),
		total: (await LivechatDepartment.model.rawCollection().aggregate([lookup, projectRooms, unwind, group, presentationProject]).toArray()).length,
	};
};

export const findAllAverageServiceTime = ({ start, end, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, options }));
export const findAllRooms = ({ start, end, answered, options }) => Promise.await(findAllRoomsAsync({ start, end, answered, options }));
export const findAllServiceTime = ({ start, end, options }) => Promise.await(findAllServiceTimeAsync({ start, end, options }));
export const findAllAverageWaitingTime = ({ start, end, options }) => Promise.await(findAllAverageWaitingTimeAsync({ start, end, options }));
export const findAllNumberOfTransferedRooms = ({ start, end, options }) => Promise.await(findAllNumberOfTransferedRoomsAsync({ start, end, options }));
export const findAllNumberOfAbandonedRooms = ({ start, end, options }) => Promise.await(findAllNumberOfAbandonedRoomsAsync({ start, end, options }));
export const findPercentageOfAbandonedRooms = ({ start, end, options }) => Promise.await(findPercentageOfAbandonedRoomsAsync({ start, end, options }));
