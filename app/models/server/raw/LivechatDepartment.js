import { BaseRaw } from './BaseRaw';
import { getValue } from '../../../settings/server/raw';

export class LivechatDepartmentRaw extends BaseRaw {
	findAllRooms({ start, end, answered, options = {} }) {
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
		const params = [lookup, project];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAllAverageServiceTime({ start, end, options = {} }) {
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
		const params = [lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAllServiceTime({ start, end, options = {} }) {
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
		const params = [lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAllAverageWaitingTime({ start, end, options = {} }) {
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
		const params = [lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAllNumberOfTransferedRooms({ start, end, options = {} }) {
		const roomsFilter = [
			{ $gte: ['$$room.ts', new Date(start)] },
			{ $lte: ['$$room.ts', new Date(end)] },
		];
		const roomsLookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: '_id',
				foreignField: 'departmentId',
				as: 'rooms',
			},
		};
		const messagesLookup = {
			$lookup: {
				from: 'rocketchat_message',
				localField: 'rooms._id',
				foreignField: 'rid',
				as: 'messages',
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
		const projectMessages = {
			$project: {
				department: '$department',
				messages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [{ $eq: ['$$message.t', 'livechat_transfer_history'] }],
						},
					},
				},
			},
		};
		const projectTransfersSize = {
			$project: {
				department: '$department',
				transfers: { $size: { $ifNull: ['$messages', []] } },
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
		const params = [roomsLookup, projectRooms, unwind, messagesLookup, projectMessages, projectTransfersSize, group, presentationProject];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	async findAllNumberOfAbandonedRooms({ start, end, options = {} }) {
		const roomsFilter = [
			{ $gte: ['$$room.ts', new Date(start)] },
			{ $lte: ['$$room.ts', new Date(end)] },
			{ $gte: ['$$room.metrics.visitorInactivity', await getValue('Livechat_visitor_inactivity_timeout')] },
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
		const params = [lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findPercentageOfAbandonedRooms({ start, end, options = {} }) {
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
		const params = [lookup, projectRooms, unwind, group, presentationProject];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}
}
