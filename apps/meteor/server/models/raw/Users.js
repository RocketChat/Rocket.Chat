import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

const queryStatusAgentOnline = (extraFilters = {}, isLivechatEnabledWhenAgentIdle) => ({
	statusLivechat: 'available',
	roles: 'livechat-agent',
	// ignore deactivated users
	active: true,
	...(!isLivechatEnabledWhenAgentIdle && {
		$or: [
			{
				status: {
					$exists: true,
					$ne: 'offline',
				},
				roles: {
					$ne: 'bot',
				},
			},
			{
				roles: 'bot',
			},
		],
	}),
	...extraFilters,
	...(isLivechatEnabledWhenAgentIdle === false && {
		statusConnection: { $ne: 'away' },
	}),
});

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

	// Move index from constructor to here
	modelIndexes() {
		return [
			{ key: { __rooms: 1 }, sparse: 1 },
			{ key: { roles: 1 }, sparse: 1 },
			{ key: { name: 1 } },
			{ key: { bio: 1 }, sparse: 1 },
			{ key: { nickname: 1 }, sparse: 1 },
			{ key: { createdAt: 1 } },
			{ key: { lastLogin: 1 } },
			{ key: { status: 1 } },
			{ key: { statusText: 1 } },
			{ key: { statusConnection: 1 }, sparse: 1 },
			{ key: { appId: 1 }, sparse: 1 },
			{ key: { type: 1 } },
			{ key: { federated: 1 }, sparse: true },
			{ key: { federation: 1 }, sparse: true },
			{ key: { isRemote: 1 }, sparse: true },
			{ key: { 'services.saml.inResponseTo': 1 } },
			{ key: { openBusinessHours: 1 }, sparse: true },
			{ key: { statusLivechat: 1 }, sparse: true },
			{ key: { extension: 1 }, sparse: true, unique: true },
			{ key: { language: 1 }, sparse: true },
			{ key: { 'active': 1, 'services.email2fa.enabled': 1 }, sparse: true }, // used by statistics
			{ key: { 'active': 1, 'services.totp.enabled': 1 }, sparse: true }, // used by statistics
			{ key: { importIds: 1 }, sparse: true },
			// Used for case insensitive queries
			// @deprecated
			// Should be converted to unique index later within a migration to prevent errors of duplicated
			// records. Those errors does not helps to identify the duplicated value so we need to find a
			// way to help the migration in case it happens.
			{
				key: { 'emails.address': 1 },
				unique: false,
				sparse: true,
				name: 'emails.address_insensitive',
				collation: { locale: 'en', strength: 2, caseLevel: false },
			},
			// Used for case insensitive queries
			// @deprecated
			// Should be converted to unique index later within a migration to prevent errors of duplicated
			// records. Those errors does not helps to identify the duplicated value so we need to find a
			// way to help the migration in case it happens.
			{
				key: { username: 1 },
				unique: false,
				sparse: true,
				name: 'username_insensitive',
				collation: { locale: 'en', strength: 2, caseLevel: false },
			},
		];
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

	findAgentsWithDepartments(role, query, options) {
		const roles = [].concat(role);

		Object.assign(query, { roles: { $in: roles } });

		const aggregate = [
			{
				$match: query,
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
				$unwind: {
					path: '$departments',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: '$_id',
					username: { $first: '$username' },
					status: { $first: '$status' },
					statusLivechat: { $first: '$statusLivechat' },
					name: { $first: '$name' },
					emails: { $first: '$emails' },
					livechat: { $first: '$livechat' },
					departments: { $push: '$departments.departmentId' },
				},
			},
			{
				$facet: {
					sortedResults: [{ $sort: options.sort }, { $skip: options.skip }, options.limit && { $limit: options.limit }],
					totalCount: [{ $group: { _id: null, total: { $sum: 1 } } }],
				},
			},
		];

		return this.col.aggregate(aggregate).toArray();
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

		const orStmt = (searchFields || []).reduce((acc, el) => {
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

		const orStmt = (searchFields || []).reduce((acc, el) => {
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

	findOneByImportId(_id, options) {
		return this.findOne({ importIds: _id }, options);
	}

	findOneByUsernameIgnoringCase(username, options) {
		if (!username) {
			throw new Error('invalid username');
		}

		const query = { username };

		return this.findOne(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneWithoutLDAPByUsernameIgnoringCase(username, options) {
		const expression = new RegExp(`^${escapeRegExp(username)}$`, 'i');

		const query = {
			'username': expression,
			'services.ldap': {
				$exists: false,
			},
		};

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

	findLDAPUsersExceptIds(userIds, options = {}) {
		const query = {
			ldap: true,
			_id: {
				$nin: userIds,
			},
		};

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

		return this.updateOne(query, update);
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

		return this.updateOne({ _id }, update);
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

		return this.updateMany(query, update);
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
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.updateMany(query, update);
	}

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds, agentId) {
		const query = {
			_id: agentId,
			roles: 'livechat-agent',
		};

		const update = {
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.updateOne(query, update);
	}

	addBusinessHourByAgentIds(agentIds = [], businessHourId) {
		const query = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update = {
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	findOnlineButNotAvailableAgents(userIds) {
		const query = {
			...(userIds && { _id: { $in: userIds } }),
			roles: 'livechat-agent',
			// Exclude away users
			status: 'online',
			// Exclude users that are already available, maybe due to other business hour
			statusLivechat: 'not-available',
		};

		return this.find(query);
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

		return this.updateMany(query, update);
	}

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment = [], businessHourId) {
		const query = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update = {
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
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

		return this.updateMany(query, update);
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

		return this.updateMany(query, update);
	}

	findAgentsAvailableWithoutBusinessHours(userIds = []) {
		return this.find(
			{
				$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
				$and: [{ roles: 'livechat-agent' }, { roles: { $ne: 'bot' } }],
				// exclude deactivated users
				active: true,
				// Avoid unnecessary updates
				statusLivechat: 'available',
				...(Array.isArray(userIds) && userIds.length > 0 && { _id: { $in: userIds } }),
			},
			{
				projection: { openBusinessHours: 1 },
			},
		);
	}

	setLivechatStatusActiveBasedOnBusinessHours(userId) {
		const query = {
			_id: userId,
			statusDefault: { $ne: 'offline' },
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

		return this.updateOne(query, update);
	}

	async isAgentWithinBusinessHours(agentId) {
		const query = {
			_id: agentId,
			$or: [
				{
					openBusinessHours: {
						$exists: true,
						$not: { $size: 0 },
					},
				},
				{
					// Bots can ignore Business Hours and be always available
					roles: 'bot',
				},
			],
		};
		return (await this.col.countDocuments(query)) > 0;
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

		return this.updateMany(query, update);
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
		return this.updateMany(
			{
				_id: userId,
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
			},
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
		return this.updateOne(query, update);
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
		return this.updateOne(query, update);
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

	countActiveUsersTOTPEnable(options) {
		const query = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.col.countDocuments(query, options);
	}

	findActiveUsersEmail2faEnable(options) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}

	countActiveUsersEmail2faEnable(options) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.col.countDocuments(query, options);
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

	removeRoomByRoomId(rid, options) {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
			options,
		);
	}

	findOneByResetToken(token, options) {
		return this.findOne({ 'services.password.reset.token': token }, options);
	}

	findOneByIdWithEmailAddress(userId, options) {
		return this.findOne(
			{
				_id: userId,
				emails: { $exists: true, $ne: [] },
			},
			options,
		);
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

	async findSearchedServerNamesByUserId(userId) {
		const user = await this.findOne(
			{
				_id: userId,
			},
			{
				projection: {
					'federation.searchedServerNames': 1,
				},
			},
		);

		return user.federation?.searchedServerNames || [];
	}

	addServerNameToSearchedServerNamesList(userId, serverName) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$addToSet: {
					'federation.searchedServerNames': serverName,
				},
			},
		);
	}

	removeServerNameFromSearchedServerNamesList(userId, serverName) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$pull: {
					'federation.searchedServerNames': serverName,
				},
			},
		);
	}

	countFederatedExternalUsers() {
		return this.col.countDocuments({
			federated: true,
		});
	}

	findOnlineUserFromList(userList, isLivechatEnabledWhenAgentIdle) {
		// TODO: Create class Agent
		const username = {
			$in: [].concat(userList),
		};

		const query = queryStatusAgentOnline({ username }, isLivechatEnabledWhenAgentIdle);

		return this.find(query);
	}

	findOneOnlineAgentByUserList(userList, options, isLivechatEnabledWhenAgentIdle) {
		// TODO:: Create class Agent
		const username = {
			$in: [].concat(userList),
		};

		const query = queryStatusAgentOnline({ username }, isLivechatEnabledWhenAgentIdle);

		return this.findOne(query, options);
	}

	getUnavailableAgents() {
		return [];
	}

	findBotAgents(usernameList) {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(usernameList && {
				username: {
					$in: [].concat(usernameList),
				},
			}),
		};

		return this.find(query);
	}

	removeAllRoomsByUserId(_id) {
		return this.updateOne(
			{
				_id,
			},
			{
				$set: { __rooms: [] },
			},
		);
	}

	removeRoomByUserId(_id, rid) {
		return this.updateOne(
			{
				_id,
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
		);
	}

	addRoomByUserId(_id, rid) {
		return this.updateOne(
			{
				_id,
				__rooms: { $ne: rid },
			},
			{
				$addToSet: { __rooms: rid },
			},
		);
	}

	addRoomByUserIds(uids, rid) {
		return this.updateMany(
			{
				_id: { $in: uids },
				__rooms: { $ne: rid },
			},
			{
				$addToSet: { __rooms: rid },
			},
		);
	}

	removeRoomByRoomIds(rids) {
		return this.updateMany(
			{
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
			},
		);
	}

	getLoginTokensByUserId(userId) {
		const query = {
			'services.resume.loginTokens.type': {
				$exists: true,
				$eq: 'personalAccessToken',
			},
			'_id': userId,
		};

		return this.find(query, { projection: { 'services.resume.loginTokens': 1 } });
	}

	addPersonalAccessTokenToUser({ userId, loginTokenObject }) {
		return this.updateOne(
			{ _id: userId },
			{
				$push: {
					'services.resume.loginTokens': loginTokenObject,
				},
			},
		);
	}

	removePersonalAccessTokenOfUser({ userId, loginTokenObject }) {
		return this.updateOne(
			{ _id: userId },
			{
				$pull: {
					'services.resume.loginTokens': loginTokenObject,
				},
			},
		);
	}

	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }) {
		const query = {
			'services.resume.loginTokens': {
				$elemMatch: { name: tokenName, type: 'personalAccessToken' },
			},
			'_id': userId,
		};

		return this.findOne(query);
	}

	setOperator(_id, operator) {
		// TODO:: Create class Agent
		const update = {
			$set: {
				operator,
			},
		};

		return this.updateOne({ _id }, update);
	}

	async checkOnlineAgents(agentId) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return !!(await this.findOne(query));
	}

	findOnlineAgents(agentId) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return this.find(query);
	}

	countOnlineAgents(agentId) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return this.col.countDocuments(query);
	}

	findOneBotAgent() {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
		};

		return this.findOne(query);
	}

	findOneOnlineAgentById(_id, isLivechatEnabledWhenAgentIdle) {
		// TODO: Create class Agent
		const query = queryStatusAgentOnline({ _id }, isLivechatEnabledWhenAgentIdle);

		return this.findOne(query);
	}

	findAgents() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.find(query);
	}

	countAgents() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.col.countDocuments(query);
	}

	// 2
	async getNextAgent(ignoreAgentId, extraQuery) {
		// TODO: Create class Agent
		// fetch all unavailable agents, and exclude them from the selection
		const unavailableAgents = (await this.getUnavailableAgents(null, extraQuery)).map((u) => u.username);
		const extraFilters = {
			...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
			// limit query to remove booked agents
			username: { $nin: unavailableAgents },
		};

		const query = queryStatusAgentOnline(extraFilters);

		const sort = {
			livechatCount: 1,
			username: 1,
		};

		const update = {
			$inc: {
				livechatCount: 1,
			},
		};

		const user = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (user && user.value) {
			return {
				agentId: user.value._id,
				username: user.value.username,
			};
		}
		return null;
	}

	async getNextBotAgent(ignoreAgentId) {
		// TODO: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
		};

		const sort = {
			livechatCount: 1,
			username: 1,
		};

		const update = {
			$inc: {
				livechatCount: 1,
			},
		};

		const user = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (user?.value) {
			return {
				agentId: user.value._id,
				username: user.value.username,
			};
		}
		return null;
	}

	setLivechatStatus(userId, status) {
		// TODO: Create class Agent
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				statusLivechat: status,
				livechatStatusSystemModified: false,
			},
		};

		return this.updateOne(query, update);
	}

	makeAgentUnavailableAndUnsetExtension(userId) {
		const query = {
			_id: userId,
			roles: 'livechat-agent',
		};

		const update = {
			$set: {
				statusLivechat: ILivechatAgentStatus.NOT_AVAILABLE,
			},
			$unset: {
				extension: 1,
			},
		};

		return this.updateOne(query, update);
	}

	setLivechatData(userId, data = {}) {
		// TODO: Create class Agent
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				livechat: data,
			},
		};

		return this.updateOne(query, update);
	}

	async closeOffice() {
		// TODO: Create class Agent
		const promises = [];
		await this.findAgents().forEach((agent) => promises.push(this.setLivechatStatus(agent._id, 'not-available')));
		await Promise.all(promises);
	}

	async openOffice() {
		// TODO: Create class Agent
		const promises = [];
		await this.findAgents().forEach((agent) => promises.push(this.setLivechatStatus(agent._id, 'available')));
		await Promise.all(promises);
	}

	getAgentInfo(agentId, showAgentEmail = false) {
		// TODO: Create class Agent
		const query = {
			_id: agentId,
		};

		const options = {
			projection: {
				name: 1,
				username: 1,
				phone: 1,
				customFields: 1,
				status: 1,
				livechat: 1,
				...(showAgentEmail && { emails: 1 }),
			},
		};

		return this.findOne(query, options);
	}

	roleBaseQuery(userId) {
		return { _id: userId };
	}

	setE2EPublicAndPrivateKeysByUserId(userId, { public_key, private_key }) {
		return this.updateOne(
			{ _id: userId },
			{
				$set: {
					'e2e.public_key': public_key,
					'e2e.private_key': private_key,
				},
			},
		);
	}

	async rocketMailUnsubscribe(_id, createdAt) {
		const query = {
			_id,
			createdAt: new Date(parseInt(createdAt)),
		};
		const update = {
			$set: {
				'mailer.unsubscribed': true,
			},
		};
		const affectedRows = (await this.updateOne(query, update)).updatedCount;
		return affectedRows;
	}

	async fetchKeysByUserId(userId) {
		const user = await this.findOne({ _id: userId }, { projection: { e2e: 1 } });

		if (!user?.e2e?.public_key) {
			return {};
		}

		return {
			public_key: user.e2e.public_key,
			private_key: user.e2e.private_key,
		};
	}

	disable2FAAndSetTempSecretByUserId(userId, tempToken) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp': {
						enabled: false,
						tempSecret: tempToken,
					},
				},
			},
		);
	}

	enable2FAAndSetSecretAndCodesByUserId(userId, secret, backupCodes) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp.enabled': true,
					'services.totp.secret': secret,
					'services.totp.hashedBackup': backupCodes,
				},
				$unset: {
					'services.totp.tempSecret': 1,
				},
			},
		);
	}

	disable2FAByUserId(userId) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp': {
						enabled: false,
					},
				},
			},
		);
	}

	update2FABackupCodesByUserId(userId, backupCodes) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp.hashedBackup': backupCodes,
				},
			},
		);
	}

	enableEmail2FAByUserId(userId) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.email2fa': {
						enabled: true,
						changedAt: new Date(),
					},
				},
			},
		);
	}

	disableEmail2FAByUserId(userId) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					'services.email2fa': {
						enabled: false,
						changedAt: new Date(),
					},
				},
			},
		);
	}

	findByIdsWithPublicE2EKey(ids, options) {
		const query = {
			'_id': {
				$in: ids,
			},
			'e2e.public_key': {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	resetE2EKey(userId) {
		return this.updateOne(
			{ _id: userId },
			{
				$unset: {
					e2e: '',
				},
			},
		);
	}

	removeExpiredEmailCodeOfUserId(userId) {
		return this.updateOne(
			{ '_id': userId, 'services.emailCode.expire': { $lt: new Date() } },
			{
				$unset: { 'services.emailCode': 1 },
			},
		);
	}

	removeEmailCodeOfUserId(userId) {
		return this.updateOne(
			{ _id: userId },
			{
				$unset: { 'services.emailCode': 1 },
			},
		);
	}

	incrementInvalidEmailCodeAttempt(userId) {
		return this.findOneAndUpdate(
			{ _id: userId },
			{
				$inc: { 'services.emailCode.attempts': 1 },
			},
			{
				returnDocument: 'after',
				projection: {
					'services.emailCode.attempts': 1,
				},
			},
		);
	}

	async maxInvalidEmailCodeAttemptsReached(userId, maxAttempts) {
		const result = await this.findOne(
			{
				'_id': userId,
				'services.emailCode.attempts': { $gte: maxAttempts },
			},
			{
				projection: {
					_id: 1,
				},
			},
		);
		return !!result?._id;
	}

	addEmailCodeByUserId(userId, code, expire) {
		return this.updateOne(
			{ _id: userId },
			{
				$set: {
					'services.emailCode': {
						code,
						expire,
						attempts: 0,
					},
				},
			},
		);
	}

	/**
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {any} options
	 */
	findActiveUsersInRoles(roles, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
			active: true,
		};

		return this.find(query, options);
	}

	countActiveUsersInRoles(roles, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
			active: true,
		};

		return this.col.countDocuments(query, options);
	}

	findOneByUsernameAndServiceNameIgnoringCase(username, userId, serviceName, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username, [`services.${serviceName}.id`]: userId };

		return this.findOne(query, options);
	}

	findOneByEmailAddressAndServiceNameIgnoringCase(emailAddress, userId, serviceName, options) {
		const query = {
			'emails.address': String(emailAddress).trim(),
			[`services.${serviceName}.id`]: userId,
		};

		return this.findOne(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneByEmailAddress(emailAddress, options) {
		const query = { 'emails.address': String(emailAddress).trim() };

		return this.findOne(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneWithoutLDAPByEmailAddress(emailAddress, options) {
		const query = {
			'email.address': emailAddress.trim().toLowerCase(),
			'services.ldap': {
				$exists: false,
			},
		};

		return this.findOne(query, options);
	}

	findOneAdmin(userId, options) {
		const query = { roles: { $in: ['admin'] }, _id: userId };

		return this.findOne(query, options);
	}

	findOneByIdAndLoginToken(_id, token, options) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findOneById(userId, options = {}) {
		const query = { _id: userId };

		return this.findOne(query, options);
	}

	findOneActiveById(userId, options) {
		const query = {
			_id: userId,
			active: true,
		};

		return this.findOne(query, options);
	}

	findOneByIdOrUsername(idOrUsername, options) {
		const query = {
			$or: [
				{
					_id: idOrUsername,
				},
				{
					username: idOrUsername,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByRolesAndType(roles, type, options) {
		const query = { roles, type };

		return this.findOne(query, options);
	}

	findNotOfflineByIds(users, options) {
		const query = {
			_id: { $in: users },
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};
		return this.find(query, options);
	}

	findUsersNotOffline(options) {
		const query = {
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	countUsersNotOffline(options) {
		const query = {
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.col.countDocuments(query, options);
	}

	findNotIdUpdatedFrom(uid, from, options) {
		const query = {
			_id: { $ne: uid },
			username: {
				$exists: 1,
			},
			_updatedAt: { $gte: from },
		};

		return this.find(query, options);
	}

	async findByRoomId(rid, options) {
		const data = (await Subscriptions.findByRoomId(rid).toArray()).map((item) => item.u._id);
		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findByUsername(username, options) {
		const query = { username };

		return this.find(query, options);
	}

	findByUsernames(usernames, options) {
		const query = { username: { $in: usernames } };

		return this.find(query, options);
	}

	findByUsernamesIgnoringCase(usernames, options) {
		const query = {
			username: {
				$in: usernames.filter(Boolean).map((u) => new RegExp(`^${escapeRegExp(u)}$`, 'i')),
			},
		};

		return this.find(query, options);
	}

	findActiveByUserIds(ids, options = {}) {
		return this.find(
			{
				active: true,
				type: { $nin: ['app'] },
				_id: { $in: ids },
			},
			options,
		);
	}

	findActiveLocalGuests(idExceptions = [], options = {}) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: {
				$eq: 'guest',
				$size: 1,
			},
			isRemote: { $ne: true },
		};

		if (idExceptions) {
			if (!Array.isArray(idExceptions)) {
				idExceptions = [idExceptions];
			}

			query._id = { $nin: idExceptions };
		}

		return this.find(query, options);
	}

	countActiveLocalGuests(idExceptions = []) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: {
				$eq: 'guest',
				$size: 1,
			},
			isRemote: { $ne: true },
		};

		if (idExceptions) {
			if (!Array.isArray(idExceptions)) {
				idExceptions = [idExceptions];
			}

			query._id = { $nin: idExceptions };
		}

		return this.col.countDocuments(query);
	}

	// 4
	findUsersByNameOrUsername(nameOrUsername, options) {
		const query = {
			username: {
				$exists: 1,
			},

			$or: [{ name: nameOrUsername }, { username: nameOrUsername }],

			type: {
				$in: ['user'],
			},
		};

		return this.find(query, options);
	}

	findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress, options) {
		const query = {
			$or: [
				{ name: usernameNameOrEmailAddress },
				{ username: usernameNameOrEmailAddress },
				{ 'emails.address': usernameNameOrEmailAddress },
			],
			type: {
				$in: ['user', 'bot'],
			},
		};

		return this.find(query, options);
	}

	findCrowdUsers(options) {
		const query = { crowd: true };

		return this.find(query, options);
	}

	async getLastLogin(options = { projection: { _id: 0, lastLogin: 1 } }) {
		options.sort = { lastLogin: -1 };
		const user = await this.findOne({}, options);
		return user?.lastLogin;
	}

	findUsersByUsernames(usernames, options) {
		const query = {
			username: {
				$in: usernames,
			},
		};

		return this.find(query, options);
	}

	findUsersByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
		};
		return this.find(query, options);
	}

	findUsersWithUsernameByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	findUsersWithUsernameByIdsNotOffline(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	/**
	 * @param {import('mongodb').Filter<import('@rocket.chat/core-typings').IStats>} projection
	 */
	getOldest(optionsParams) {
		const query = {
			_id: {
				$ne: 'rocket.cat',
			},
		};

		const options = {
			...optionsParams,
			sort: {
				createdAt: 1,
			},
		};

		return this.findOne(query, options);
	}

	countRemote(options = {}) {
		return this.col.countDocuments({ isRemote: true }, options);
	}

	findActiveRemote(options = {}) {
		return this.find(
			{
				active: true,
				isRemote: true,
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	findActiveFederated(options = {}) {
		return this.find(
			{
				active: true,
				federated: true,
			},
			options,
		);
	}

	getSAMLByIdAndSAMLProvider(_id, provider) {
		return this.findOne(
			{
				_id,
				'services.saml.provider': provider,
			},
			{
				'services.saml': 1,
			},
		);
	}

	findBySAMLNameIdOrIdpSession(nameID, idpSession) {
		return this.find({
			$or: [{ 'services.saml.nameID': nameID }, { 'services.saml.idpSession': idpSession }],
		});
	}

	countBySAMLNameIdOrIdpSession(nameID, idpSession) {
		return this.col.countDocuments({
			$or: [{ 'services.saml.nameID': nameID }, { 'services.saml.idpSession': idpSession }],
		});
	}

	findBySAMLInResponseTo(inResponseTo) {
		return this.find({
			'services.saml.inResponseTo': inResponseTo,
		});
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);

		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.updateOne(query, update);
	}

	updateInviteToken(_id, inviteToken) {
		const update = {
			$set: {
				inviteToken,
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateLastLoginById(_id) {
		const update = {
			$set: {
				lastLogin: new Date(),
			},
		};

		return this.updateOne({ _id }, update);
	}

	addPasswordToHistory(_id, password, passwordHistoryAmount) {
		const update = {
			$push: {
				'services.passwordHistory': {
					$each: [password],
					$slice: -Number(passwordHistoryAmount),
				},
			},
		};
		return this.updateOne({ _id }, update);
	}

	setServiceId(_id, serviceName, serviceId) {
		const update = { $set: {} };

		const serviceIdKey = `services.${serviceName}.id`;
		update.$set[serviceIdKey] = serviceId;

		return this.updateOne({ _id }, update);
	}

	setUsername(_id, username) {
		const update = { $set: { username } };

		return this.updateOne({ _id }, update);
	}

	setEmail(_id, email) {
		const update = {
			$set: {
				emails: [
					{
						address: email,
						verified: false,
					},
				],
			},
		};

		return this.updateOne({ _id }, update);
	}

	// 5
	setEmailVerified(_id, email) {
		const query = {
			_id,
			emails: {
				$elemMatch: {
					address: email,
					verified: false,
				},
			},
		};

		const update = {
			$set: {
				'emails.$.verified': true,
			},
		};

		return this.updateOne(query, update);
	}

	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetName(_id) {
		const update = {
			$unset: {
				name,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setCustomFields(_id, fields) {
		const values = {};
		Object.keys(fields).forEach((key) => {
			values[`customFields.${key}`] = fields[key];
		});

		const update = { $set: values };

		return this.updateOne({ _id }, update);
	}

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetAvatarData(_id) {
		const update = {
			$unset: {
				avatarOrigin: 1,
				avatarETag: 1,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setUserActive(_id, active) {
		if (active == null) {
			active = true;
		}
		const update = {
			$set: {
				active,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setAllUsersActive(active) {
		const update = {
			$set: {
				active,
			},
		};

		return this.updateMany({}, update);
	}

	/**
	 * @param latestLastLoginDate
	 * @param {IRole['_id']} role the role id
	 * @param {boolean} active
	 */
	setActiveNotLoggedInAfterWithRole(latestLastLoginDate, role = 'user', active = false) {
		const neverActive = { lastLogin: { $exists: 0 }, createdAt: { $lte: latestLastLoginDate } };
		const idleTooLong = { lastLogin: { $lte: latestLastLoginDate } };

		const query = {
			$or: [neverActive, idleTooLong],
			active: true,
			roles: role,
		};

		const update = {
			$set: {
				active,
			},
		};

		return this.updateMany(query, update);
	}

	unsetRequirePasswordChange(_id) {
		const update = {
			$unset: {
				requirePasswordChange: true,
				requirePasswordChangeReason: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	resetPasswordAndSetRequirePasswordChange(_id, requirePasswordChange, requirePasswordChangeReason) {
		const update = {
			$unset: {
				'services.password': 1,
			},
			$set: {
				requirePasswordChange,
				requirePasswordChangeReason,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setLanguage(_id, language) {
		const update = {
			$set: {
				language,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setProfile(_id, profile) {
		const update = {
			$set: {
				'settings.profile': profile,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setBio(_id, bio = '') {
		const update = {
			...(bio.trim()
				? {
						$set: {
							bio,
						},
				  }
				: {
						$unset: {
							bio: 1,
						},
				  }),
		};
		return this.updateOne({ _id }, update);
	}

	setNickname(_id, nickname = '') {
		const update = {
			...(nickname.trim()
				? {
						$set: {
							nickname,
						},
				  }
				: {
						$unset: {
							nickname: 1,
						},
				  }),
		};
		return this.updateOne({ _id }, update);
	}

	clearSettings(_id) {
		const update = {
			$set: {
				settings: {},
			},
		};

		return this.updateOne({ _id }, update);
	}

	setPreferences(_id, preferences) {
		const settingsObject = Object.assign(
			{},
			...Object.keys(preferences).map((key) => ({
				[`settings.preferences.${key}`]: preferences[key],
			})),
		);

		const update = {
			$set: settingsObject,
		};
		if (parseInt(preferences.clockMode) === 0) {
			delete update.$set['settings.preferences.clockMode'];
			update.$unset = { 'settings.preferences.clockMode': 1 };
		}

		return this.updateOne({ _id }, update);
	}

	setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(_id, token, hash, until) {
		return this.updateOne(
			{
				_id,
				'services.resume.loginTokens.hashedToken': token,
			},
			{
				$set: {
					'services.resume.loginTokens.$.twoFactorAuthorizedHash': hash,
					'services.resume.loginTokens.$.twoFactorAuthorizedUntil': until,
				},
			},
		);
	}

	setUtcOffset(_id, utcOffset) {
		const query = {
			_id,
			utcOffset: {
				$ne: utcOffset,
			},
		};

		const update = {
			$set: {
				utcOffset,
			},
		};

		return this.updateOne(query, update);
	}

	saveUserById(_id, data) {
		const setData = {};
		const unsetData = {};

		if (data.name != null) {
			if (data.name.trim()) {
				setData.name = data.name.trim();
			} else {
				unsetData.name = 1;
			}
		}

		if (data.email != null) {
			if (data.email.trim()) {
				setData.emails = [{ address: data.email.trim() }];
			} else {
				unsetData.emails = 1;
			}
		}

		if (data.phone != null) {
			if (data.phone.trim()) {
				setData.phone = [{ phoneNumber: data.phone.trim() }];
			} else {
				unsetData.phone = 1;
			}
		}

		const update = {};

		if (setData) {
			update.$set = setData;
		}

		if (unsetData) {
			update.$unset = unsetData;
		}

		if (update) {
			return true;
		}

		return this.updateOne({ _id }, update);
	}

	setReason(_id, reason) {
		const update = {
			$set: {
				reason,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetReason(_id) {
		const update = {
			$unset: {
				reason: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	async bannerExistsById(_id, bannerId) {
		const query = {
			_id,
			[`banners.${bannerId}`]: {
				$exists: true,
			},
		};

		return (await this.col.countDocuments(query)) !== 0;
	}

	setBannerReadById(_id, bannerId) {
		const update = {
			$set: {
				[`banners.${bannerId}.read`]: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	removeBannerById(_id, bannerId) {
		const update = {
			$unset: {
				[`banners.${bannerId}`]: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	removeSamlServiceSession(_id) {
		const update = {
			$unset: {
				'services.saml.idpSession': '',
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateDefaultStatus(_id, statusDefault) {
		return this.updateOne(
			{
				_id,
				statusDefault: { $ne: statusDefault },
			},
			{
				$set: {
					statusDefault,
				},
			},
		);
	}

	setSamlInResponseTo(_id, inResponseTo) {
		this.updateOne(
			{
				_id,
			},
			{
				$set: {
					'services.saml.inResponseTo': inResponseTo,
				},
			},
		);
	}

	// INSERT
	create(data) {
		const user = {
			createdAt: new Date(),
			avatarOrigin: 'none',
		};

		Object.assign(user, data);

		return this.insertOne(user);
	}

	// REMOVE
	removeById(_id) {
		return this.deleteOne({ _id });
	}

	removeLivechatData(userId) {
		const query = {
			_id: userId,
		};

		const update = {
			$unset: {
				livechat: true,
			},
		};

		return this.updateOne(query, update);
	}

	/*
		Find users to send a message by email if:
		- he is not online
		- has a verified email
		- has not disabled email notifications
		- `active` is equal to true (false means they were deactivated and can't login)
	*/
	getUsersToSendOfflineEmail(usersIds) {
		const query = {
			'_id': {
				$in: usersIds,
			},
			'active': true,
			'status': 'offline',
			'statusConnection': {
				$ne: 'online',
			},
			'emails.verified': true,
		};

		const options = {
			projection: {
				'name': 1,
				'username': 1,
				'emails': 1,
				'settings.preferences.emailNotificationMode': 1,
				'language': 1,
			},
		};

		return this.find(query, options);
	}

	countActiveUsersByService(serviceName, options) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: { $ne: ['guest'] },
			[`services.${serviceName}`]: { $exists: true },
		};

		return this.col.countDocuments(query, options);
	}

	// here
	getActiveLocalUserCount() {
		return Promise.all([
			// Count all active users (fast based on index)
			this.col.countDocuments({
				active: true,
			}),
			// Count all active that are guests, apps, bots or federated
			// Fast based on indexes, usually based on guest index as is usually small
			this.col.countDocuments({
				active: true,
				$or: [{ roles: ['guest'] }, { type: { $in: ['app', 'bot'] } }, { federated: true }, { isRemote: true }],
			}),
			// Get all active and remove the guests, apps, bots and federated
		]).then((results) => results.reduce((a, b) => a - b));
	}

	getActiveLocalGuestCount(idExceptions = []) {
		return this.countActiveLocalGuests(idExceptions);
	}

	removeOlderResumeTokensByUserId(userId, fromDate) {
		this.updateOne(
			{ _id: userId },
			{
				$pull: {
					'services.resume.loginTokens': {
						when: { $lt: fromDate },
					},
				},
			},
		);
	}

	findAllUsersWithPendingAvatar() {
		const query = {
			_pendingAvatarUrl: {
				$exists: true,
			},
		};

		const options = {
			projection: {
				_id: 1,
				name: 1,
				_pendingAvatarUrl: 1,
			},
		};

		return this.find(query, options);
	}

	updateCustomFieldsById(userId, customFields) {
		return this.updateOne(
			{ _id: userId },
			{
				$set: {
					customFields,
				},
			},
		);
	}

	countRoomMembers(roomId) {
		return this.col.countDocuments({ __rooms: roomId, active: true });
	}

	removeAgent(_id) {
		const update = {
			$set: {
				operator: false,
			},
			$unset: {
				livechat: 1,
				statusLivechat: 1,
				extension: 1,
				openBusinessHours: 1,
			},
		};

		return this.updateOne({ _id }, update);
	}

	countByRole(role) {
		return this.col.countDocuments({ roles: role });
	}

	updateLivechatStatusByAgentIds(userIds, status) {
		return this.updateMany(
			{
				_id: { $in: userIds },
			},
			{
				$set: {
					statusLivechat: status,
				},
			},
		);
	}
}
