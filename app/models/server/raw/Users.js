import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class UsersRaw extends BaseRaw {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			__rooms: 0,
		};
	}

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findOneByUsername(username, options = null) {
		const query = { username };

		return this.findOne(query, options);
	}

	findOneAgentById(_id, options) {
		const query = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne(query, options);
	}

	findUsersInRolesWithQuery(roles, query, options) {
		roles = [].concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.find(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase(username, rid, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ escapeRegExp(username) }$`, 'i');
		}

		const query = {
			__rooms: rid,
			username,
		};

		return this.findOne(query, options);
	}

	findOneByIdAndLoginHashedToken(_id, token, options = {}) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findByActiveUsersExcept(searchTerm, exceptions, options, searchFields, extraQuery = [], { startsWith = false, endsWith = false } = {}) {
		if (exceptions == null) { exceptions = []; }
		if (options == null) { options = {}; }
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		// if the search term is empty, don't need to have the $or statement (because it would be an empty regex)
		if (searchTerm === '') {
			const query = {
				$and: [
					{
						active: true,
						username: { $exists: true, $nin: exceptions },
					},
					...extraQuery,
				],
			};

			return this.find(query, options);
		}

		const termRegex = new RegExp((startsWith ? '^' : '') + escapeRegExp(searchTerm) + (endsWith ? '$' : ''), 'i');

		// const searchFields = forcedSearchFields || settings.get('Accounts_SearchFields').trim().split(',');

		const orStmt = (searchFields || []).reduce(function(acc, el) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);

		const query = {
			$and: [
				{
					active: true,
					username: { $exists: true, $nin: exceptions },
					$or: orStmt,
				},
				...extraQuery,
			],
		};

		return this.find(query, options);
	}

	findActiveByIds(userIds, options = {}) {
		const query = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find(query, options);
	}

	findByIds(userIds, options = {}) {
		const query = {
			_id: { $in: userIds },
		};

		return this.find(query, options);
	}

	findOneByUsernameIgnoringCase(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ escapeRegExp(username) }$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
			roles: roleName,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department, ignoreAgentId) {
		const aggregate = [
			{ $match: { status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent', ...ignoreAgentId && { _id: { $ne: ignoreAgentId } } } },
			{ $lookup: {
				from: 'rocketchat_subscription',
				let: { id: '$_id' },
				pipeline: [{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$u._id', '$$id'] },
								{ $eq: ['$open', true] },
								{ $ne: ['$onHold', true] },
								{ ...department && { $eq: ['$department', department] } },
							],
						},
					},
				}],
				as: 'subs' },
			},
			{ $lookup: { from: 'rocketchat_livechat_department_agents', localField: '_id', foreignField: 'agentId', as: 'departments' } },
			{ $project: { agentId: '$_id', username: 1, lastRoutingTime: 1, departments: 1, count: { $size: '$subs' } } },
			{ $sort: { count: 1, lastRoutingTime: 1, username: 1 } },
		];

		if (department) {
			aggregate.push({ $unwind: '$departments' });
			aggregate.push({ $match: { 'departments.departmentId': department } });
		}

		aggregate.push({ $limit: 1 });

		const [agent] = await this.col.aggregate(aggregate).toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getLastAvailableAgentRouted(department, ignoreAgentId) {
		const aggregate = [
			{ $match: { status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent', ...ignoreAgentId && { _id: { $ne: ignoreAgentId } } } },
			{ $lookup: { from: 'rocketchat_livechat_department_agents', localField: '_id', foreignField: 'agentId', as: 'departments' } },
			{ $project: { agentId: '$_id', username: 1, lastRoutingTime: 1, departments: 1 } },
			{ $sort: { lastRoutingTime: 1, username: 1 } },
		];

		if (department) {
			aggregate.push({ $unwind: '$departments' });
			aggregate.push({ $match: { 'departments.departmentId': department } });
		}

		aggregate.push({ $limit: 1 });

		const [agent] = await this.col.aggregate(aggregate).toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async setLastRoutingTime(userId) {
		const result = await this.col.findAndModify(
			{ _id: userId }
			, {
				sort: {
					_id: 1,
				},
			}, {
				$set: {
					lastRoutingTime: new Date(),
				},
			});
		return result.value;
	}

	async getAgentAndAmountOngoingChats(userId) {
		const aggregate = [
			{ $match: { _id: userId, status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent' } },
			{ $lookup: { from: 'rocketchat_subscription', localField: '_id', foreignField: 'u._id', as: 'subs' } },
			{ $project: { agentId: '$_id', username: 1, lastAssignTime: 1, lastRoutingTime: 1, 'queueInfo.chats': { $size: { $filter: { input: '$subs', as: 'sub', cond: { $and: [{ $eq: ['$$sub.t', 'l'] }, { $eq: ['$$sub.open', true] }, { $ne: ['$$sub.onHold', true] }] } } } } } },
			{ $sort: { 'queueInfo.chats': 1, lastAssignTime: 1, lastRoutingTime: 1, username: 1 } },
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

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(termRegex, exceptions, conditions, options) {
		if (exceptions == null) { exceptions = []; }
		if (conditions == null) { conditions = {}; }
		if (options == null) { options = {}; }
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const query = {
			$or: [{
				username: termRegex,
			}, {
				name: termRegex,
			}, {
				nickname: termRegex,
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
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col.aggregate(params).toArray();
	}

	getTotalOfRegisteredUsersByDate({ start, end, options = {} }) {
		const params = [
			{
				$match: {
					createdAt: { $gte: start, $lte: end },
					roles: { $ne: 'anonymous' },
				},
			},
			{
				$group: {
					_id: {
						$concat: [
							{ $substr: ['$createdAt', 0, 4] },
							{ $substr: ['$createdAt', 5, 2] },
							{ $substr: ['$createdAt', 8, 2] },
						],
					},
					users: { $sum: 1 },
				},
			},
			{
				$group: {
					_id: '$_id',
					users: { $sum: '$users' },
				},
			},
			{
				$project: {
					_id: 0,
					date: '$_id',
					users: 1,
					type: 'users',
				},
			},
		];
		if (options.sort) {
			params.push({ $sort: options.sort });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params).toArray();
	}

	getUserLanguages() {
		const pipeline = [
			{
				$match: {
					language: {
						$exists: true,
						$ne: '',
					},
				},
			},
			{
				$group: {
					_id: '$language',
					total: { $sum: 1 },
				},
			},
		];

		return this.col.aggregate(pipeline).toArray();
	}

	updateStatusText(_id, statusText) {
		const update = {
			$set: {
				statusText,
			},
		};

		return this.update({ _id }, update);
	}

	updateStatusByAppId(appId, status) {
		const query = {
			appId,
			status: { $ne: status },
		};

		const update = {
			$set: {
				status,
			},
		};

		return this.update(query, update, { multi: true });
	}

	openAgentsBusinessHoursByBusinessHourId(businessHourIds) {
		const query = {
			roles: 'livechat-agent',
		};

		const update = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.update(query, update, { multi: true });
	}

	addBusinessHourByAgentIds(agentIds = [], businessHourId) {
		const query = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	removeBusinessHourByAgentIds(agentIds = [], businessHourId) {
		const query = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update = {
			$pull: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment = [], businessHourId) {
		const query = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment = [], businessHourId) {
		const query = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update = {
			$pull: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds) {
		const query = {
			roles: 'livechat-agent',
		};

		const update = {
			$pull: {
				openBusinessHours: { $in: businessHourIds },
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateLivechatStatusBasedOnBusinessHours(userIds = []) {
		const query = {
			$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
			roles: 'livechat-agent',
			...Array.isArray(userIds) && userIds.length > 0 && { _id: { $in: userIds } },
		};

		const update = {
			$set: {
				statusLivechat: 'not-available',
			},
		};

		return this.update(query, update, { multi: true });
	}

	async isAgentWithinBusinessHours(agentId) {
		return await this.find({
			_id: agentId,
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		}).count() > 0;
	}

	removeBusinessHoursFromAllUsers() {
		const query = {
			roles: 'livechat-agent',
			openBusinessHours: {
				$exists: true,
			},
		};

		const update = {
			$unset: {
				openBusinessHours: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	resetTOTPById(userId) {
		return this.col.updateOne({
			_id: userId,
		}, {
			$unset: {
				'services.totp': 1,
			},
		});
	}

	removeResumeService(userId) {
		return this.col.updateOne({
			_id: userId,
		}, {
			$unset: {
				'services.resume': 1,
			},
		});
	}

	removeRoomsByRoomIdsAndUserId(rids, userId) {
		return this.update({
			_id: userId,
			__rooms: { $in: rids },
		}, {
			$pullAll: { __rooms: rids },
		}, { multi: true });
	}
}
