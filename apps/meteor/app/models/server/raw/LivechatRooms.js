import { BaseRaw } from './BaseRaw';
import { getValue } from '../../../settings/server/raw';

export class LivechatRoomsRaw extends BaseRaw {
	getQueueMetrics({ departmentId, agentId, includeOfflineAgents, options = {} }) {
		const match = { $match: { t: 'l', open: true, servedBy: { $exists: true } } };
		const matchUsers = { $match: {} };
		if (departmentId && departmentId !== 'undefined') {
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
		const sort = { $sort: options.sort || { chats: -1 } };
		const pagination = [sort];

		if (options.offset) {
			pagination.push({ $skip: options.offset });
		}
		if (options.count) {
			pagination.push({ $limit: options.count });
		}

		const facet = {
			$facet: {
				sortedResults: pagination,
				totalCount: [{ $group: { _id: null, total: { $sum: 1 } } }],
			},
		};

		const params = [...firstParams, usersGroup, project, facet];
		return this.col.aggregate(params).toArray();
	}

	async findAllNumberOfAbandonedRooms({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				't': 'l',
				'metrics.visitorInactivity': {
					$gte: await getValue('Livechat_visitor_inactivity_timeout'),
				},
				'ts': { $gte: new Date(start) },
				'closedAt': { $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				abandonedRooms: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				abandonedRooms: 1,
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	async findPercentageOfAbandonedRooms({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
				abandonedChats: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $ifNull: ['$metrics.visitorInactivity', false] },
									{
										$gte: ['$metrics.visitorInactivity', await getValue('Livechat_visitor_inactivity_timeout')],
									},
								],
							},
							1,
							0,
						],
					},
				},
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				percentageOfAbandonedChats: {
					$floor: {
						$cond: [{ $eq: ['$rooms', 0] }, 0, { $divide: [{ $multiply: ['$abandonedChats', 100] }, '$rooms'] }],
					},
				},
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findAllAverageOfChatDurationTime({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start) },
				closedAt: { $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
				chatsDuration: { $sum: '$metrics.chatDuration' },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				averageChatDurationTimeInSeconds: {
					$ceil: { $cond: [{ $eq: ['$rooms', 0] }, 0, { $divide: ['$chatsDuration', '$rooms'] }] },
				},
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findAllAverageWaitingTime({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
				waitingResponse: { $ne: true },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
				chatsFirstResponses: { $sum: '$metrics.response.ft' },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				averageWaitingTimeInSeconds: {
					$ceil: {
						$cond: [{ $eq: ['$rooms', 0] }, 0, { $divide: ['$chatsFirstResponses', '$rooms'] }],
					},
				},
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findAllRooms({ start, end, answered, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				t: 'l',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		if (answered !== undefined) {
			match.$match.waitingResponse = { [answered ? '$ne' : '$eq']: true };
		}
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				rooms: 1,
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findAllServiceTime({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				't': 'l',
				'ts': { $gte: new Date(start) },
				'closedAt': { $lte: new Date(end) },
				'metrics.serviceTimeDuration': { $exists: true },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
				serviceTimeDuration: { $sum: '$metrics.serviceTimeDuration' },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				chats: '$rooms',
				serviceTimeDuration: { $ceil: '$serviceTimeDuration' },
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
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
		if (departmentId && departmentId !== 'undefined') {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [
			...firstParams,
			departmentsGroup,
			departmentsProject,
			roomsUnwind,
			messagesLookup,
			messagesProject,
			transferProject,
			transferGroup,
			presentationProject,
			sort,
		];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params, { allowDiskUse: true }).toArray();
	}

	countAllOpenChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			't': 'l',
			'metrics.chatDuration': {
				$exists: false,
			},
			'$or': [
				{
					onHold: {
						$exists: false,
					},
				},
				{
					onHold: {
						$exists: true,
						$eq: false,
					},
				},
			],
			'servedBy': { $exists: true },
			'ts': { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId && departmentId !== 'undefined') {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllClosedChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			't': 'l',
			'metrics.chatDuration': {
				$exists: true,
			},
			'ts': { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId && departmentId !== 'undefined') {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllQueuedChatsBetweenDate({ start, end, departmentId }) {
		const query = {
			t: 'l',
			servedBy: { $exists: false },
			open: true,
			ts: { $gte: new Date(start), $lte: new Date(end) },
		};
		if (departmentId && departmentId !== 'undefined') {
			query.departmentId = departmentId;
		}
		return this.find(query).count();
	}

	countAllOpenChatsByAgentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				't': 'l',
				'servedBy.username': { $exists: true },
				'open': true,
				'$or': [
					{
						onHold: {
							$exists: false,
						},
					},
					{
						onHold: {
							$exists: true,
							$eq: false,
						},
					},
				],
				'ts': { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: '$servedBy.username',
				chats: { $sum: 1 },
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group]).toArray();
	}

	countAllOnHoldChatsByAgentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				't': 'l',
				'servedBy.username': { $exists: true },
				'open': true,
				'onHold': {
					$exists: true,
					$eq: true,
				},
				'ts': { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: '$servedBy.username',
				chats: { $sum: 1 },
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group]).toArray();
	}

	countAllClosedChatsByAgentBetweenDate({ start, end, departmentId }) {
		const match = {
			$match: {
				't': 'l',
				'open': { $exists: false },
				'servedBy.username': { $exists: true },
				'ts': { $gte: new Date(start) },
				'closedAt': { $lte: new Date(end) },
			},
		};
		const group = {
			$group: {
				_id: '$servedBy.username',
				chats: { $sum: 1 },
			},
		};
		if (departmentId && departmentId !== 'undefined') {
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
		if (departmentId && departmentId !== 'undefined') {
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
		if (departmentId && departmentId !== 'undefined') {
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
						$cond: [
							{
								$and: [{ $ifNull: ['$metrics.response.avg', false] }],
							},
							1,
							0,
						],
					},
				},
				maxFirstResponse: { $max: '$metrics.response.ft' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [{ $eq: ['$roomsWithResponseTime', 0] }, 0, { $divide: ['$sumResponseAvg', '$roomsWithResponseTime'] }],
					},
				},
				longest: '$maxFirstResponse',
			},
		};
		if (departmentId && departmentId !== 'undefined') {
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
						$cond: [
							{
								$and: [{ $ifNull: ['$metrics.reaction.ft', false] }],
							},
							1,
							0,
						],
					},
				},
				maxFirstReaction: { $max: '$metrics.reaction.ft' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [{ $eq: ['$roomsWithFirstReaction', 0] }, 0, { $divide: ['$sumReactionFirstResponse', '$roomsWithFirstReaction'] }],
					},
				},
				longest: '$maxFirstReaction',
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group, project]).toArray();
	}

	calculateDurationTimingsBetweenDates({ start, end, departmentId }) {
		const match = {
			$match: {
				't': 'l',
				'ts': { $gte: new Date(start), $lte: new Date(end) },
				'metrics.chatDuration': { $exists: true },
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
						$cond: [
							{
								$and: [{ $ifNull: ['$metrics.chatDuration', false] }],
							},
							1,
							0,
						],
					},
				},
				maxChatDuration: { $max: '$metrics.chatDuration' },
			},
		};
		const project = {
			$project: {
				avg: {
					$trunc: {
						$cond: [{ $eq: ['$roomsWithChatDuration', 0] }, 0, { $divide: ['$sumChatDuration', '$roomsWithChatDuration'] }],
					},
				},
				longest: '$maxChatDuration',
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		return this.col.aggregate([match, group, project]).toArray();
	}

	findAllAverageOfServiceTime({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				't': 'l',
				'ts': { $gte: new Date(start), $lte: new Date(end) },
				'responseBy.lastMessageTs': { $exists: true },
				'servedBy.ts': { $exists: true },
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departmentId',
				},
				rooms: { $sum: 1 },
				allServiceTime: {
					$sum: { $divide: [{ $subtract: ['$responseBy.lastMessageTs', '$servedBy.ts'] }, 1000] },
				},
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				averageServiceTimeInSeconds: {
					$ceil: { $cond: [{ $eq: ['$rooms', 0] }, 0, { $divide: ['$allServiceTime', '$rooms'] }] },
				},
			},
		};
		if (departmentId && departmentId !== 'undefined') {
			match.$match.departmentId = departmentId;
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findByVisitorId(visitorId, options) {
		const query = {
			't': 'l',
			'v._id': visitorId,
		};
		return this.find(query, options);
	}

	findRoomsByVisitorIdAndMessageWithCriteria({ visitorId, searchText, open, served, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				'v._id': visitorId,
				...(open !== undefined && { open: { $exists: open } }),
				...(served !== undefined && { servedBy: { $exists: served } }),
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_message',
				localField: '_id',
				foreignField: 'rid',
				as: 'messages',
			},
		};
		const matchMessages = searchText && {
			$match: { 'messages.msg': { $regex: `.*${searchText}.*` } },
		};

		const params = [match, lookup];

		if (matchMessages) {
			params.push(matchMessages);
		}

		const project = {
			$project: {
				fname: 1,
				ts: 1,
				v: 1,
				msgs: 1,
				servedBy: 1,
				closedAt: 1,
				closedBy: 1,
				closer: 1,
				tags: 1,
				closingMessage: {
					$filter: {
						input: '$messages',
						as: 'messages',
						cond: { $eq: ['$$messages.t', 'livechat-close'] },
					},
				},
			},
		};

		const unwindClosingMsg = {
			$unwind: { path: '$closingMessage', preserveNullAndEmptyArrays: true },
		};
		const sort = { $sort: options.sort || { ts: -1 } };

		params.push(project, unwindClosingMsg, sort);

		if (onlyCount) {
			params.push({ $count: 'count' });
			return this.col.aggregate(params);
		}

		if (options.skip) {
			params.push({ $skip: options.skip });
		}

		if (options.limit) {
			params.push({ $limit: options.limit });
		}

		return this.col.aggregate(params);
	}

	findRoomsWithCriteria({
		agents,
		roomName,
		departmentId,
		open,
		served,
		createdAt,
		closedAt,
		tags,
		customFields,
		visitorId,
		roomIds,
		onhold,
		options = {},
	}) {
		const query = {
			t: 'l',
		};
		if (agents) {
			query.$or = [{ 'servedBy._id': { $in: agents } }, { 'servedBy.username': { $in: agents } }];
		}
		if (roomName) {
			query.fname = new RegExp(roomName, 'i');
		}
		if (departmentId && departmentId !== 'undefined') {
			query.departmentId = departmentId;
		}
		if (open !== undefined) {
			query.open = { $exists: open };
			query.onHold = { $ne: true };
		}
		if (served !== undefined) {
			query.servedBy = { $exists: served };
		}
		if (visitorId && visitorId !== 'undefined') {
			query['v._id'] = visitorId;
		}
		if (createdAt) {
			query.ts = {};
			if (createdAt.start) {
				query.ts.$gte = new Date(createdAt.start);
			}
			if (createdAt.end) {
				query.ts.$lte = new Date(createdAt.end);
			}
		}
		if (closedAt) {
			query.closedAt = {};
			if (closedAt.start) {
				query.closedAt.$gte = new Date(closedAt.start);
			}
			if (closedAt.end) {
				query.closedAt.$lte = new Date(closedAt.end);
			}
		}
		if (tags) {
			query.tags = { $in: tags };
		}
		if (customFields) {
			query.$and = Object.keys(customFields).map((key) => ({
				[`livechatData.${key}`]: new RegExp(customFields[key], 'i'),
			}));
		}

		if (roomIds) {
			query._id = { $in: roomIds };
		}

		if (onhold) {
			query.onHold = {
				$exists: true,
				$eq: onhold,
			};
		}

		return this.find(query, {
			sort: options.sort || { name: 1 },
			skip: options.offset,
			limit: options.count,
		});
	}

	getOnHoldConversationsBetweenDate(from, to, departmentId) {
		const query = {
			onHold: {
				$exists: true,
				$eq: true,
			},
			ts: {
				$gte: new Date(from), // ISO Date, ts >= date.gte
				$lt: new Date(to), // ISODate, ts < date.lt
			},
		};

		if (departmentId && departmentId !== 'undefined') {
			query.departmentId = departmentId;
		}

		return this.find(query).count();
	}

	findAllServiceTimeByAgent({ start, end, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				't': 'l',
				'servedBy._id': { $exists: true },
				'metrics.serviceTimeDuration': { $exists: true },
				'ts': {
					$gte: start,
					$lte: end,
				},
			},
		};
		const group = {
			$group: {
				_id: { _id: '$servedBy._id', username: '$servedBy.username' },
				chats: { $sum: 1 },
				serviceTimeDuration: { $sum: '$metrics.serviceTimeDuration' },
			},
		};
		const project = {
			$project: {
				_id: '$_id._id',
				username: '$_id.username',
				chats: 1,
				serviceTimeDuration: { $ceil: '$serviceTimeDuration' },
			},
		};
		const sort = { $sort: options.sort || { username: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	findAllAverageServiceTimeByAgents({ start, end, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				't': 'l',
				'servedBy._id': { $exists: true },
				'metrics.serviceTimeDuration': { $exists: true },
				'ts': {
					$gte: start,
					$lte: end,
				},
			},
		};
		const group = {
			$group: {
				_id: { _id: '$servedBy._id', username: '$servedBy.username' },
				chats: { $sum: 1 },
				serviceTimeDuration: { $sum: '$metrics.serviceTimeDuration' },
			},
		};
		const project = {
			$project: {
				_id: '$_id._id',
				username: '$_id.username',
				name: '$_id.name',
				active: '$_id.active',
				averageServiceTimeInSeconds: {
					$ceil: {
						$cond: [{ $eq: ['$chats', 0] }, 0, { $divide: ['$serviceTimeDuration', '$chats'] }],
					},
				},
			},
		};
		const sort = { $sort: options.sort || { username: 1 } };
		const params = [match, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params);
	}

	setDepartmentByRoomId(roomId, departmentId) {
		return this.update({ _id: roomId }, { $set: { departmentId } });
	}
}
