import { BaseRaw } from './BaseRaw';
import { getValue } from '../../../settings/server/raw';

export class LivechatRoomsRaw extends BaseRaw {
	getQueueMetrics({ departmentId, agentId, includeOfflineAgents, options = {} }) {
		const match = { $match: { t: 'l', open: true, servedBy: { $exists: true } } };
		const matchUsers = { $match: {} };
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		if (agentId) {
			matchUsers.$match['user._id'] = agentId;
		}
		if (!includeOfflineAgents) {
			matchUsers.$match['user.status'] = { $ne: 'offline' };
			matchUsers.$match['user.statusLivechat'] = { $eq: 'available' };
		}
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
					departmentId: '$departmentId',
					name: '$departments.name',
					room: '$$ROOT',
				},
			},
		};
		const usersLookup = {
			$lookup: {
				from: 'users',
				localField: '_id.room.servedBy._id',
				foreignField: '_id',
				as: 'user',
			},
		};
		const usersUnwind = {
			$unwind: {
				path: '$user',
				preserveNullAndEmptyArrays: true,
			},
		};
		const usersGroup = {
			$group: {
				_id: {
					userId: '$user._id',
					username: '$user.username',
					status: '$user.status',
					departmentId: '$_id.departmentId',
					departmentName: '$_id.name',
				},
				chats: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: 0,
				user: {
					_id: '$_id.userId',
					username: '$_id.username',
					status: '$_id.status',
				},
				department: {
					_id: { $ifNull: ['$_id.departmentId', null] },
					name: { $ifNull: ['$_id.departmentName', null] },
				},
				chats: 1,
			},
		};
		const firstParams = [match, departmentsLookup, departmentsUnwind, departmentsGroup, usersLookup, usersUnwind];
		if (Object.keys(matchUsers.$match)) {
			firstParams.push(matchUsers);
		}
		const params = [...firstParams, usersGroup, project];
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
				ts: { $gte: new Date(start), $lte: new Date(end) },
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

	findAllAverageOfChatDurationTime({ start, end, departmentId, options = {} }) {
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
				averageChatDurationTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$_id.sizeOfRooms', 0] }, 0, { $divide: ['$chatsDuration', '$_id.sizeOfRooms'] }] } },
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

	countAllOpenChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			t: 'l',
			'metrics.chatDuration': {
				$exists: false,
			},
			servedBy: { $exists: true },
			ts: { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId) {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllClosedChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			t: 'l',
			'metrics.chatDuration': {
				$exists: true,
			},
			servedBy: { $exists: true },
			ts: { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId) {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllQueuedChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			t: 'l',
			servedBy: { $exists: false },
			ts: { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId) {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllOpenChatsByAgentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				'servedBy.username': { $exists: true },
				open: true,
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: '$servedBy.username',
				chats: { $sum: 1 },
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group]).toArray();
	}

	countAllClosedChatsByAgentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				open: { $exists: false },
				'servedBy.username': { $exists: true },
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: '$servedBy.username',
				chats: { $sum: 1 },
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group]).toArray();
	}

	countAllOpenChatsByDepartmentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				open: true,
				departmentId: { $exists: true },
				ts: { $gte: new Date(start), $lte: new Date(end) },
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
					_id: '$departments._id',
					name: '$departments.name',
				},
				chats: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: '$_id._id',
				name: '$_id.name',
				chats: 1,
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		const params = [match, lookup, unwind, group, project];
		return this.col.aggregate(params).toArray();
	}

	countAllClosedChatsByDepartmentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				open: { $exists: false },
				departmentId: { $exists: true },
				ts: { $gte: new Date(start), $lte: new Date(end) },
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
					_id: '$departments._id',
					name: '$departments.name',
				},
				chats: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: '$_id._id',
				name: '$_id.name',
				chats: 1,
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		const params = [match, lookup, unwind, group, project];
		return this.col.aggregate(params).toArray();
	}

	calculateResponseTimingsBetweenDates({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: null,
				sumResponseAvg: {
					$sum: '$metrics.response.avg',
				},
				roomsWithResponseTime: {
					$sum: {
						$cond: [{
							$and: [
								{ $ifNull: ['$metrics.response.avg', false] },
							],
						}, 1, 0],
					},
				},
				maxFirstResponse: { $max: '$metrics.response.ft' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [
							{ $eq: ['$roomsWithResponseTime', 0] },
							0,
							{ $divide: ['$sumResponseAvg', '$roomsWithResponseTime'] },
						],
					},
				},
				longest: '$maxFirstResponse',
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group, project]).toArray();
	}

	calculateReactionTimingsBetweenDates({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: null,
				sumReactionFirstResponse: {
					$sum: '$metrics.reaction.ft',
				},
				roomsWithFirstReaction: {
					$sum: {
						$cond: [{
							$and: [
								{ $ifNull: ['$metrics.reaction.ft', false] },
							],
						}, 1, 0],
					},
				},
				maxFirstReaction: { $max: '$metrics.reaction.ft' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [
							{ $eq: ['$roomsWithFirstReaction', 0] },
							0,
							{ $divide: ['$sumReactionFirstResponse', '$roomsWithFirstReaction'] },
						],
					},
				},
				longest: '$maxFirstReaction',
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group, project]).toArray();
	}

	calculateDurationTimingsBetweenDates({ start, end, departmentId }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: null,
				sumChatDuration: {
					$sum: '$metrics.chatDuration',
				},
				roomsWithChatDuration: {
					$sum: {
						$cond: [{
							$and: [
								{ $ifNull: ['$metrics.chatDuration', false] },
							],
						}, 1, 0],
					},
				},
				maxChatDuration: { $max: '$metrics.chatDuration' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [
							{ $eq: ['$roomsWithChatDuration', 0] },
							0,
							{ $divide: ['$sumChatDuration', '$roomsWithChatDuration'] },
						],
					},
				},
				longest: '$maxChatDuration',
			},
		};
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group, project]).toArray();
	}

	findAllAverageOfServiceTime({ start, end, departmentId, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
				'responseBy.lastMessageTs': { $exists: true },
				'servedBy.ts': { $exists: true },
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
		const serviceTimeProject = {
			$project: {
				name: 1,
				sizeOfRooms: 1,
				allServiceTime: { $divide: [{ $subtract: ['$rooms.responseBy.lastMessageTs', '$rooms.servedBy.ts'] }, 1000] },
			},
		};
		const roomsGroup = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$_id',
					name: '$name',
					sizeOfRooms: '$sizeOfRooms',
					allServiceTime: '$allServiceTime',
				},
			},

		};
		const presentationProject = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				name: { $ifNull: ['$_id.name', null] },
				averageServiceTimeInSeconds: { $ceil: { $cond: [{ $eq: ['$_id.sizeOfRooms', 0] }, 0, { $divide: ['$_id.allServiceTime', '$_id.sizeOfRooms'] }] } },
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
		const params = [...firstParams, departmentsGroup, departmentsProject, roomsUnwind, serviceTimeProject, roomsGroup, presentationProject];
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
