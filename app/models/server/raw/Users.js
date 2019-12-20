import moment from 'moment';
import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

import { Users } from '..';

export class UsersRaw extends BaseRaw {
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findUsersInRolesWithQuery(roles, query, options) {
		roles = [].concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.find(query, options);
	}

	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department) {
		const aggregate = [
			{ $match: { status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent' } },
			{ $lookup: { from: 'view_livechat_queue_status', localField: '_id', foreignField: '_id', as: 'LivechatQueueStatus' } }, // the `view_livechat_queue_status` it's a view created when the server starts
			{ $lookup: { from: 'rocketchat_livechat_department_agents', localField: '_id', foreignField: 'agentId', as: 'departments' } },
			{ $project: { agentId: '$_id', username: 1, lastRoutingTime: 1, departments: 1, queueInfo: { $arrayElemAt: ['$LivechatQueueStatus', 0] } } },
			{ $sort: { 'queueInfo.chats': 1, lastRoutingTime: 1, username: 1 } },
		];

		if (department) {
			aggregate.push({ $unwind: '$departments' });
			aggregate.push({ $match: { 'departments.departmentId': department } });
		}

		aggregate.push({ $limit: 1 });

		const [agent] = await this.col.aggregate(aggregate).toArray();
		if (agent) {
			Users.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getAgentAndAmountOngoingChats(userId) {
		const aggregate = [
			{ $match: { _id: userId, status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent' } },
			{ $lookup: { from: 'view_livechat_queue_status', localField: '_id', foreignField: '_id', as: 'LivechatQueueStatus' } },
			{ $project: { username: 1, queueInfo: { $arrayElemAt: ['$LivechatQueueStatus', 0] } } },
		];

		const [agent] = await this.col.aggregate(aggregate).toArray();
		return agent;
	}

	findAllResumeTokensByUserId(userId) {
		return this.col.aggregate([
			{
				$match: {
					_id: userId,
				},
			},
			{
				$project: {
					tokens: {
						$filter: {
							input: '$services.resume.loginTokens',
							as: 'token',
							cond: {
								$ne: ['$$token.type', 'personalAccessToken'],
							},
						},
					},
				},
			},
			{ $unwind: '$tokens' },
			{ $sort: { 'tokens.when': 1 } },
			{ $group: { _id: '$_id', tokens: { $push: '$tokens' } } },
		]).toArray();
	}

	findAllAverageServiceTime({ start, end, options = {} }) {
		const roomsFilter = [
			{ $gte: ['$$room.ts', new Date(start)] },
			{ $lte: ['$$room.ts', new Date(end)] },
		];
		const match = { $match: { roles: { $in: ['livechat-agent'] } } };
		const lookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: '_id',
				foreignField: 'servedBy._id',
				as: 'rooms',
			},
		};
		const projects = [
			{
				$project: {
					user: '$$ROOT',
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
					user: '$user',
					chats: { $size: '$rooms' },
					chatsDuration: { $sum: '$rooms.metrics.chatDuration' },
				},
			},
			{
				$project: {
					username: '$user.username',
					name: '$user.name',
					active: '$user.active',
					averageServiceTimeInSeconds: {
						$ceil: {
							$cond: [
								{ $eq: ['$chats', 0] },
								0,
								{ $divide: ['$chatsDuration', '$chats'] },
							],
						},
					},
				},
			}];
		const params = [match, lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: options.sort || { username: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAllServiceTime({ start, end, options = {} }) {
		const roomsFilter = [
			{ $gte: ['$$room.ts', new Date(start)] },
			{ $lte: ['$$room.ts', new Date(end)] },
		];
		const match = { $match: { roles: { $in: ['livechat-agent'] } } };
		const lookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: '_id',
				foreignField: 'servedBy._id',
				as: 'rooms',
			},
		};
		const projects = [
			{
				$project: {
					user: '$$ROOT',
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
					username: '$user.username',
					name: '$user.name',
					active: '$user.active',
					chats: { $size: '$rooms' },
					chatsDuration: { $ceil: { $sum: '$rooms.metrics.chatDuration' } },
				},
			}];
		const params = [match, lookup, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: options.sort || { username: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findAvailableServiceTimeHistory({ start, end, fullReport, options = {} }) {
		const sessionFilter = [
			{ $gte: ['$$session.date', parseInt(moment(start).format('YYYYMMDD'))] },
			{ $lte: ['$$session.date', parseInt(moment(end).format('YYYYMMDD'))] },
		];
		const match = { $match: { roles: { $in: ['livechat-agent'] } } };
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_agent_activity',
				localField: '_id',
				foreignField: 'agentId',
				as: 'sessions',
			},
		};
		const sessionProject = {
			$project: {
				user: '$$ROOT',
				sessions: {
					$filter: {
						input: '$sessions',
						as: 'session',
						cond: {
							$and: sessionFilter,
						},
					},
				},
			},
		};
		const presentationProject = {
			$project: {
				username: '$user.username',
				name: '$user.name',
				active: '$user.active',
				availableTimeInSeconds: { $sum: '$sessions.availableTime' },
			},
		};
		if (fullReport) {
			presentationProject.$project['sessions.serviceHistory'] = 1;
		}
		const params = [match, lookup, sessionProject, presentationProject];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: options.sort || { username: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(searchTerm, exceptions, conditions, options) {
		if (exceptions == null) { exceptions = []; }
		if (conditions == null) { conditions = {}; }
		if (options == null) { options = {}; }
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			$or: [{
				username: termRegex,
			}, {
				name: termRegex,
			}],
			active: true,
			type: {
				$in: ['user', 'bot'],
			},
			$and: [{
				username: {
					$exists: true,
				},
			}, {
				username: {
					$nin: exceptions,
				},
			}],
			...conditions,
		};

		return this.find(query, options);
	}

	countAllAgentsStatus({ departmentId = undefined }) {
		const match = {
			$match: {
				roles: { $in: ['livechat-agent'] },
			},
		};
		const group = {
			$group: {
				_id: null,
				offline: {
					$sum: {
						$cond: [{
							$or: [{
								$and: [
									{ $eq: ['$status', 'offline'] },
									{ $eq: ['$statusLivechat', 'available'] },
								],
							},
							{ $eq: ['$statusLivechat', 'not-available'] },
							],
						}, 1, 0],
					},
				},
				away: {
					$sum: {
						$cond: [{
							$and: [
								{ $eq: ['$status', 'away'] },
								{ $eq: ['$statusLivechat', 'available'] },
							],
						}, 1, 0],
					},
				},
				busy: {
					$sum: {
						$cond: [{
							$and: [
								{ $eq: ['$status', 'busy'] },
								{ $eq: ['$statusLivechat', 'available'] },
							],
						}, 1, 0],
					},
				},
				available: {
					$sum: {
						$cond: [{
							$and: [
								{ $eq: ['$status', 'online'] },
								{ $eq: ['$statusLivechat', 'available'] },
							],
						}, 1, 0],
					},
				},
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department_agents',
				localField: '_id',
				foreignField: 'agentId',
				as: 'departments',
			},
		};
		const unwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsMatch = {
			$match: {
				'departments.departmentId': departmentId,
			},
		};
		const params = [match];
		if (departmentId) {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col.aggregate(params).toArray();
	}
}
