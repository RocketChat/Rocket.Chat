import { BaseRaw } from './BaseRaw';

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

	findByVisitorId(visitorId, options) {
		const query = {
			t: 'l',
			'v._id': visitorId,
		};

		return this.find(query, options);
	}

	findRoomsWithCriteria({ agents, roomName, departmentId, open, createdAt, closedAt, tags, customFields, options = {} }) {
		const match = {
			$match: {
				t: 'l',
			},
		};
		if (agents) {
			match.$match.$or = [{ 'servedBy._id': { $in: agents } }, { 'servedBy.username': { $in: agents } }];
		}
		if (roomName) {
			match.$match.fname = new RegExp(roomName, 'i');
		}
		if (departmentId) {
			match.$match.departmentId = departmentId;
		}
		if (open !== undefined) {
			match.$match.open = { $exists: open };
		}
		if (createdAt) {
			match.$match.ts = {};
			if (createdAt.start) {
				match.$match.ts.$gte = new Date(createdAt.start);
			}
			if (createdAt.end) {
				match.$match.ts.$lte = new Date(createdAt.end);
			}
		}
		if (closedAt) {
			match.$match.closedAt = {};
			if (closedAt.start) {
				match.$match.closedAt.$gte = new Date(closedAt.start);
			}
			if (closedAt.end) {
				match.$match.closedAt.$lte = new Date(closedAt.end);
			}
		}
		if (tags) {
			match.$match.tags = { $in: tags };
		}
		if (customFields) {
			match.$match.$and = Object.keys(customFields).map((key) => ({ [`livechatData.${ key }`]: new RegExp(customFields[key], 'i') }));
		}
		const firstParams = [match];
		if (options.offset) {
			firstParams.push({ $skip: options.offset });
		}
		if (options.count) {
			firstParams.push({ $limit: options.count });
		}
		if (options.sort) {
			firstParams.push({ $sort: options.sort });
		}
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'department',
			},
		};
		const unwind = {
			$unwind: {
				path: '$department',
				preserveNullAndEmptyArrays: true,
			},
		};
		const params = [...firstParams, lookup, unwind];
		if (options.fields) {
			params.push({ $project: options.fields });
		}
		return this.col.aggregate(params).toArray();
	}
}
