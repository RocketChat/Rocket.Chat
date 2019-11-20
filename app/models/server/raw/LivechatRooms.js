import { BaseRaw } from './BaseRaw';
import { getValue } from '../../../settings/server/raw';

export class LivechatRoomsRaw extends BaseRaw {
	async findAllNumberOfAbandonedRooms({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				'metrics.visitorInactivity': { $gte: await getValue('Livechat_visitor_inactivity_timeout') },
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const unwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				abandonedRooms: { $size: '$rooms' },
			},
		};
		const firstParams = [match, lookup, unwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, group, presentationProject];
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

	findPercentageOfAbandonedRooms({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const departmentsProject = {
			$project: {
				_id: '$_id.departmentId',
				name: '$_id.name',
				rooms: 1,
				sizeOfRooms: { $size: '$rooms' },
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$rooms',
				preserveNullAndEmptyArrays: true,
			},
		};
		const roomsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$_id',
					name: '$name',
					sizeOfRooms: '$sizeOfRooms',
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
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				percentageOfAbandonedChats: {
					$floor: {
						$cond: [
							{ $eq: ['$_id.sizeOfRooms', 0] },
							0,
							{ $divide: [{ $multiply: ['$abandonedChats', 100] }, '$_id.sizeOfRooms'] },
						],
					},
				},
			},
		};
		const firstParams = [match, lookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, roomsGroup, presentationProject];
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

	findAllAverageServiceTime({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const departmentsProject = {
			$project: {
				_id: '$_id.departmentId',
				name: '$_id.name',
				rooms: 1,
				sizeOfRooms: { $size: '$rooms' },
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$rooms',
				preserveNullAndEmptyArrays: true,
			},
		};
		const roomsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$_id',
					name: '$name',
					sizeOfRooms: '$sizeOfRooms',
				},
				chatsDuration: {
					$sum: '$rooms.metrics.chatDuration',
				},
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				averageServiceTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$_id.sizeOfRooms', 0] }, 0, { $divide: ['$chatsDuration', '$_id.sizeOfRooms'] }] } },
			},
		};
		const firstParams = [match, lookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, roomsGroup, presentationProject];
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

	findAllAverageWaitingTime({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
				waitingResponse: { $ne: true },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: '_id',
				foreignField: 'departmentId',
				as: 'rooms',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const departmentsProject = {
			$project: {
				_id: '$_id.departmentId',
				name: '$_id.name',
				rooms: 1,
				sizeOfRooms: { $size: '$rooms' },
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$rooms',
				preserveNullAndEmptyArrays: true,
			},
		};
		const roomsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$_id',
					name: '$name',
					sizeOfRooms: '$sizeOfRooms',
				},
				chatsFirstResponses: {
					$sum: '$rooms.metrics.response.ft',
				},
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				averageWaitingTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$_id.sizeOfRooms', 0] }, 0, { $divide: ['$chatsFirstResponses', '$_id.sizeOfRooms'] }] } },
			},
		};
		const firstParams = [match, lookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, roomsGroup, presentationProject];
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

	findAllRooms({ start, end, answered, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		if (answered !== undefined) {
			match.$match.waitingResponse = { [answered ? '$ne' : '$eq']: true };
		}
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const projects = [
			{
				$project: {
					_id: '$_id.departmentId',
					name: '$_id.name',
					rooms: { $size: '$rooms' },
				},
			},
			{
				$project: {
					_id: { $ifNull: ['$_id', null] },
					name: { $ifNull: ['$name', null] },
					rooms: 1,
				},
			},
		];
		const firstParams = [match, lookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, ...projects];
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

	findAllServiceTime({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const departmentsProject = {
			$project: {
				_id: '$_id.departmentId',
				name: '$_id.name',
				rooms: 1,
				sizeOfRooms: { $size: '$rooms' },
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$rooms',
				preserveNullAndEmptyArrays: true,
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				chats: '$_id.sizeOfRooms',
				chatsDuration: { $ceil: '$chatsDuration' },
			},
		};
		const roomsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$_id',
					name: '$name',
					sizeOfRooms: '$sizeOfRooms',
				},
				chatsDuration: {
					$sum: '$rooms.metrics.chatDuration',
				},
			},
		};
		const firstParams = [match, lookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, roomsGroup, presentationProject];
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

	findAllNumberOfTransferredRooms({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const departmentsLookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const departmentsUnwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const departmentsProject = {
			$project: {
				_id: '$_id.departmentId',
				name: '$_id.name',
				rooms: 1,
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$rooms',
				preserveNullAndEmptyArrays: true,
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
		const messagesProject = {
			$project: {
				_id: 1,
				name: 1,
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
		const transferProject = {
			$project: {
				name: 1,
				transfers: { $size: { $ifNull: ['$messages', []] } },
			},
		};
		const transferGroup = {
			$group: {
				_id: {
					departmentId: '$_id',
					name: '$name',
				},
				numberOfTransferredRooms: { $sum: '$transfers' },
			},
		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				numberOfTransferredRooms: 1,
			},
		};
		const firstParams = [match, departmentsLookup, departmentsUnwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, messagesLookup, messagesProject, transferProject, transferGroup, presentationProject];
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
