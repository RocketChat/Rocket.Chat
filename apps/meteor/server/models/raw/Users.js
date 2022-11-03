import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class UsersRaw extends BaseRaw {
	constructor(db, trash) {
		super(db, 'users', trash, {
			collectionNameResolver(name) {
				return name;
			},
		});

		this.defaultFields = {
			__rooms: 0,
		};
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id'][]} roles list of role ids
	 */
	addRolesByUserId(uid, roles) {
		if (!Array.isArray(roles)) {
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] Users.addRolesByUserId: roles should be an array');
		}

		const query = {
			_id: uid,
		};

		const update = {
			$addToSet: {
				roles: { $each: roles },
			},
		};
		return this.updateOne(query, update);
	}

	/**
	 * @param {IRole['_id'][]} roles list of role ids
	 * @param {null} scope the value for the role scope (room id) - not used in the users collection
	 * @param {any} options
	 */
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findPaginatedUsersInRoles(roles, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.findPaginated(query, options);
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

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findUsersInRolesWithQuery(roles, query, options) {
		roles = [].concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.find(query, options);
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findPaginatedUsersInRolesWithQuery(roles, query, options) {
		roles = [].concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.findPaginated(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase(username, rid, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
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
		if (exceptions == null) {
			exceptions = [];
		}
		if (options == null) {
			options = {};
		}
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp((startsWith ? '^' : '') + escapeRegExp(searchTerm) + (endsWith ? '$' : ''), 'i');

		const orStmt = (searchFields || []).reduce(function (acc, el) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);

		const query = {
			$and: [
				{
					active: true,
					username: {
						$exists: true,
						...(exceptions.length > 0 && { $nin: exceptions }),
					},
					// if the search term is empty, don't need to have the $or statement (because it would be an empty regex)
					...(searchTerm && orStmt.length > 0 && { $or: orStmt }),
				},
				...extraQuery,
			],
		};

		return this.find(query, options);
	}

	findPaginatedByActiveUsersExcept(
		searchTerm,
		exceptions,
		options,
		searchFields,
		extraQuery = [],
		{ startsWith = false, endsWith = false } = {},
	) {
		if (exceptions == null) {
			exceptions = [];
		}
		if (options == null) {
			options = {};
		}
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp((startsWith ? '^' : '') + escapeRegExp(searchTerm) + (endsWith ? '$' : ''), 'i');

		const orStmt = (searchFields || []).reduce(function (acc, el) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);

		const query = {
			$and: [
				{
					active: true,
					username: {
						$exists: true,
						...(exceptions.length > 0 && { $nin: exceptions }),
					},
					// if the search term is empty, don't need to have the $or statement (because it would be an empty regex)
					...(searchTerm && orStmt.length > 0 && { $or: orStmt }),
				},
				...extraQuery,
			],
		};

		return this.findPaginated(query, options);
	}

	findPaginatedByActiveLocalUsersExcept(searchTerm, exceptions, options, forcedSearchFields, localDomain) {
		const extraQuery = [
			{
				$or: [{ federation: { $exists: false } }, { 'federation.origin': localDomain }],
			},
		];
		return this.findPaginatedByActiveUsersExcept(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findPaginatedByActiveExternalUsersExcept(searchTerm, exceptions, options, forcedSearchFields, localDomain) {
		const extraQuery = [{ federation: { $exists: true } }, { 'federation.origin': { $ne: localDomain } }];
		return this.findPaginatedByActiveUsersExcept(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findActive(query, options = {}) {
		Object.assign(query, { active: true });

		return this.find(query, options);
	}

	findActiveByIds(userIds, options = {}) {
		const query = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find(query, options);
	}

	findActiveByIdsOrUsernames(userIds, options = {}) {
		const query = {
			$or: [{ _id: { $in: userIds } }, { username: { $in: userIds } }],
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
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	async findOneByLDAPId(id, attribute = undefined) {
		const query = {
			'services.ldap.id': id,
		};

		if (attribute) {
			query['services.ldap.idAttribute'] = attribute;
		}

		return this.findOne(query);
	}

	async findOneByAppId(appId, options) {
		const query = { appId };

		return this.findOne(query, options);
	}

	findLDAPUsers(options) {
		const query = { ldap: true };

		return this.find(query, options);
	}

	findConnectedLDAPUsers(options) {
		const query = {
			'ldap': true,
			'services.resume.loginTokens': {
				$exists: true,
				$ne: [],
			},
		};

		return this.find(query, options);
	}

	isUserInRole(userId, roleId) {
		const query = {
			_id: userId,
			roles: roleId,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department, ignoreAgentId) {
		const aggregate = [
			{
				$match: {
					status: { $exists: true, $ne: 'offline' },
					statusLivechat: 'available',
					roles: 'livechat-agent',
					...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
				},
			},
			{
				$lookup: {
					from: 'rocketchat_subscription',
					let: { id: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$u._id', '$$id'] },
										{ $eq: ['$open', true] },
										{ $ne: ['$onHold', true] },
										{ ...(department && { $eq: ['$department', department] }) },
									],
								},
							},
						},
					],
					as: 'subs',
				},
			},
			{
				$lookup: {
					from: 'rocketchat_livechat_department_agents',
					localField: '_id',
					foreignField: 'agentId',
					as: 'departments',
				},
			},
			{
				$project: {
					agentId: '$_id',
					username: 1,
					lastRoutingTime: 1,
					departments: 1,
					count: { $size: '$subs' },
				},
			},
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
			{
				$match: {
					status: { $exists: true, $ne: 'offline' },
					statusLivechat: 'available',
					roles: 'livechat-agent',
					...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
				},
			},
			{
				$lookup: {
					from: 'rocketchat_livechat_department_agents',
					localField: '_id',
					foreignField: 'agentId',
					as: 'departments',
				},
			},
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
		const result = await this.findOneAndUpdate(
			{ _id: userId },
			{
				$set: {
					lastRoutingTime: new Date(),
				},
			},
			{ returnDocument: 'after' },
		);
		return result.value;
	}

	setLivechatStatusIf(userId, status, conditions = {}, extraFields = {}) {
		// TODO: Create class Agent
		const query = {
			_id: userId,
			...conditions,
		};

		const update = {
			$set: {
				statusLivechat: status,
				...extraFields,
			},
		};

		return this.update(query, update);
	}

	async getAgentAndAmountOngoingChats(userId) {
		const aggregate = [
			{
				$match: {
					_id: userId,
					statusLivechat: 'available',
					roles: 'livechat-agent',
				},
			},
			{
				$lookup: {
					from: 'rocketchat_subscription',
					localField: '_id',
					foreignField: 'u._id',
					as: 'subs',
				},
			},
			{
				$project: {
					'agentId': '$_id',
					'username': 1,
					'lastAssignTime': 1,
					'lastRoutingTime': 1,
					'queueInfo.chats': {
						$size: {
							$filter: {
								input: '$subs',
								as: 'sub',
								cond: {
									$and: [{ $eq: ['$$sub.t', 'l'] }, { $eq: ['$$sub.open', true] }, { $ne: ['$$sub.onHold', true] }],
								},
							},
						},
					},
				},
			},
			{ $sort: { 'queueInfo.chats': 1, 'lastAssignTime': 1, 'lastRoutingTime': 1, 'username': 1 } },
		];

		const [agent] = await this.col.aggregate(aggregate).toArray();
		return agent;
	}

	findAllResumeTokensByUserId(userId) {
		return this.col
			.aggregate([
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
			])
			.toArray();
	}

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(termRegex, exceptions, conditions, options) {
		if (exceptions == null) {
			exceptions = [];
		}
		if (conditions == null) {
			conditions = {};
		}
		if (options == null) {
			options = {};
		}
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const query = {
			$or: [
				{
					username: termRegex,
				},
				{
					name: termRegex,
				},
				{
					nickname: termRegex,
				},
			],
			active: true,
			type: {
				$in: ['user', 'bot'],
			},
			$and: [
				{
					username: {
						$exists: true,
					},
				},
				{
					username: {
						$nin: exceptions,
					},
				},
			],
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
						$cond: [
							{
								$or: [
									{
										$and: [{ $eq: ['$status', 'offline'] }, { $eq: ['$statusLivechat', 'available'] }],
									},
									{ $eq: ['$statusLivechat', 'not-available'] },
								],
							},
							1,
							0,
						],
					},
				},
				away: {
					$sum: {
						$cond: [
							{
								$and: [{ $eq: ['$status', 'away'] }, { $eq: ['$statusLivechat', 'available'] }],
							},
							1,
							0,
						],
					},
				},
				busy: {
					$sum: {
						$cond: [
							{
								$and: [{ $eq: ['$status', 'busy'] }, { $eq: ['$statusLivechat', 'available'] }],
							},
							1,
							0,
						],
					},
				},
				available: {
					$sum: {
						$cond: [
							{
								$and: [{ $eq: ['$status', 'online'] }, { $eq: ['$statusLivechat', 'available'] }],
							},
							1,
							0,
						],
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
						$concat: [{ $substr: ['$createdAt', 0, 4] }, { $substr: ['$createdAt', 5, 2] }, { $substr: ['$createdAt', 8, 2] }],
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

	/**
	 * @param {string} userId
	 * @param {object} status
	 * @param {string} status.status
	 * @param {string} status.statusConnection
	 * @param {string} [status.statusDefault]
	 * @param {string} [status.statusText]
	 */
	updateStatusById(userId, { statusDefault, status, statusConnection, statusText }) {
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				status,
				statusConnection,
				...(statusDefault && { statusDefault }),
				...(statusText && {
					statusText: String(statusText).trim().substr(0, 120),
				}),
			},
		};

		// We don't want to update the _updatedAt field on this operation,
		// so we can check if the status update triggered a change
		return this.col.updateOne(query, update);
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

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds, agentId) {
		const query = {
			_id: agentId,
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
			...(Array.isArray(userIds) && userIds.length > 0 && { _id: { $in: userIds } }),
		};

		const update = {
			$set: {
				statusLivechat: 'not-available',
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLivechatStatusActiveBasedOnBusinessHours(userId) {
		const query = {
			_id: userId,
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		};

		const update = {
			$set: {
				statusLivechat: 'available',
			},
		};

		return this.update(query, update);
	}

	async isAgentWithinBusinessHours(agentId) {
		return (
			(await this.find({
				_id: agentId,
				openBusinessHours: {
					$exists: true,
					$not: { $size: 0 },
				},
			}).count()) > 0
		);
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
		return this.col.updateOne(
			{
				_id: userId,
			},
			{
				$unset: {
					'services.totp': 1,
				},
			},
		);
	}

	unsetOneLoginToken(_id, token) {
		const update = {
			$pull: {
				'services.resume.loginTokens': { hashedToken: token },
			},
		};

		return this.col.updateOne({ _id }, update);
	}

	unsetLoginTokens(userId) {
		return this.col.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.resume.loginTokens': [],
				},
			},
		);
	}

	removeNonPATLoginTokensExcept(userId, authToken) {
		return this.col.updateOne(
			{
				_id: userId,
			},
			{
				$pull: {
					'services.resume.loginTokens': {
						when: { $exists: true },
						hashedToken: { $ne: authToken },
					},
				},
			},
		);
	}

	removeRoomsByRoomIdsAndUserId(rids, userId) {
		return this.update(
			{
				_id: userId,
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
			},
			{ multi: true },
		);
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id']} roles the list of role ids to remove
	 */
	removeRolesByUserId(uid, roles) {
		const query = {
			_id: uid,
		};

		const update = {
			$pullAll: {
				roles,
			},
		};

		return this.updateOne(query, update);
	}

	async isUserInRoleScope(uid) {
		const query = {
			_id: uid,
		};

		const options = {
			projection: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}

	addBannerById(_id, banner) {
		const query = {
			_id,
			[`banners.${banner.id}.read`]: {
				$ne: true,
			},
		};

		const update = {
			$set: {
				[`banners.${banner.id}`]: banner,
			},
		};

		return this.updateOne(query, update);
	}

	// Voip functions
	findOneByAgentUsername(username, options) {
		const query = { username, roles: 'livechat-agent' };

		return this.findOne(query, options);
	}

	findOneByExtension(extension, options) {
		const query = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions(extensions, options) {
		const query = {
			extension: {
				$in: extensions,
			},
		};

		return this.find(query, options);
	}

	getVoipExtensionByUserId(userId, options) {
		const query = {
			_id: userId,
			extension: { $exists: true },
		};
		return this.findOne(query, options);
	}

	setExtension(userId, extension) {
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				extension,
			},
		};
		return this.update(query, update);
	}

	unsetExtension(userId) {
		const query = {
			_id: userId,
		};
		const update = {
			$unset: {
				extension: true,
			},
		};
		return this.update(query, update);
	}

	getAvailableAgentsIncludingExt(includeExt, text, options) {
		const query = {
			roles: { $in: ['livechat-agent'] },
			$and: [
				...(text && text.trim()
					? [{ $or: [{ username: new RegExp(escapeRegExp(text), 'i') }, { name: new RegExp(escapeRegExp(text), 'i') }] }]
					: []),
				{ $or: [{ extension: { $exists: false } }, ...(includeExt ? [{ extension: includeExt }] : [])] },
			],
		};

		return this.findPaginated(query, options);
	}

	findActiveUsersTOTPEnable(options) {
		const query = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.find(query, options);
	}

	findActiveUsersEmail2faEnable(options) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}

	setAsFederated(uid) {
		const query = {
			_id: uid,
		};

		const update = {
			$set: {
				federated: true,
			},
		};
		return this.updateOne(query, update);
	}

	removeRoomByRoomId(rid) {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
		);
	}

	findOneByResetToken(token, options) {
		return this.findOne({ 'services.password.reset.token': token }, options);
	}

	setFederationAvatarUrlById(userId, federationAvatarUrl) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'federation.avatarUrl': federationAvatarUrl,
				},
			},
		);
	}
}
