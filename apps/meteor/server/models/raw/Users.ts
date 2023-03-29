import type { IUser, RocketChatRecordDeleted, IRole, IRoom, UserStatus, ILivechatAgent } from '@rocket.chat/core-typings';
import type { IUsersModel, DefaultFields } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Collection, Db, Filter, FindOptions, UpdateFilter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

type StartsEndsWith = { startsWith?: boolean; endsWith?: boolean } | undefined;

export class UsersRaw extends BaseRaw<IUser, DefaultFields<IUser>> implements Partial<IUsersModel> {
	public readonly defaultFields = {
		__rooms: 0 as const,
	};

	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUser>>) {
		super(db, 'users', trash, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	addRolesByUserId(uid: IUser['_id'], roles: Array<IRole['_id']>) {
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

	findUsersInRoles<T = IUser>(roles: Array<IRole['_id']>, _scope: null, options: FindOptions) {
		const query = {
			roles: { $in: roles },
		};

		return this.find<T>(query, options);
	}

	findPaginatedUsersInRoles<T = IUser>(roles: Array<IRole['_id']>, options: FindOptions) {
		const query = {
			roles: { $in: roles },
		};

		return this.findPaginated<T>(query, options);
	}

	findOneByUsername<T = IUser>(username: IUser['username'], options?: FindOptions) {
		const query = { username };

		return this.findOne<T>(query, options);
	}

	findOneAgentById<T = ILivechatAgent>(_id: IUser['_id'], options: FindOptions) {
		const query = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne<T>(query, options);
	}

	findUsersInRolesWithQuery<T = IUser>(roles: Array<IRole['_id']> | IRole['_id'], query: Filter<IUser>, options: FindOptions) {
		roles = Array.isArray(roles) ? roles : [roles];
		Object.assign(query, { roles: { $in: roles } });

		return this.find<T>(query, options);
	}

	findPaginatedUsersInRolesWithQuery<T = IUser>(roles: Array<IRole['_id']> | IRole['_id'], query: Filter<IUser>, options: FindOptions) {
		roles = Array.isArray(roles) ? roles : [roles];
		Object.assign(query, { roles: { $in: roles } });

		return this.findPaginated<T>(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase<T = IUser>(username: IUser['username'], rid: IRoom['_id'], options: FindOptions) {
		let usernameRegexp;
		if (typeof username === 'string') {
			usernameRegexp = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = {
			__rooms: rid,
			username: usernameRegexp ?? username,
		};

		return this.findOne<T>(query, options);
	}

	findOneByIdAndLoginHashedToken<T = IUser>(_id: IUser['_id'], token: string, options: FindOptions = {}) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne<T>(query, options);
	}

	findByActiveUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: Array<IUser['username']>,
		options: FindOptions,
		searchFields: string[],
		extraQuery: Array<Filter<IUser>> = [], // seems to never be used
		{ startsWith = false, endsWith = false }: StartsEndsWith = {},
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

		const searchFieldsQuery = (searchFields || []).reduce<Array<Record<string, RegExp>>>(function (accumulator, currentElement) {
			accumulator.push({ [currentElement.trim()]: termRegex });
			return accumulator;
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
					...(searchTerm && searchFieldsQuery.length > 0 && { $or: searchFieldsQuery }),
				},
				...extraQuery,
			],
		};

		return this.find<T>(query, options);
	}

	findPaginatedByActiveUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: Array<IUser['username']>,
		options: FindOptions,
		searchFields: string[],
		extraQuery: Array<Filter<IUser>> = [],
		{ startsWith = false, endsWith = false }: StartsEndsWith = {},
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

		const searchFieldsQuery = (searchFields || []).reduce<Array<Record<string, RegExp>>>(function (acc, el) {
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
					...(searchTerm && searchFieldsQuery.length > 0 && { $or: searchFieldsQuery }),
				},
				...extraQuery,
			],
		};

		return this.findPaginated<T>(query, options);
	}

	findPaginatedByActiveLocalUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: string[],
		options: FindOptions,
		forcedSearchFields: string[],
		localDomain: string,
	) {
		const extraQuery = [
			{
				$or: [{ federation: { $exists: false } }, { 'federation.origin': localDomain }],
			},
		];
		return this.findPaginatedByActiveUsersExcept<T>(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findPaginatedByActiveExternalUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: string[],
		options: FindOptions,
		forcedSearchFields: string[],
		localDomain: string,
	) {
		const extraQuery = [{ federation: { $exists: true } }, { 'federation.origin': { $ne: localDomain } }];
		return this.findPaginatedByActiveUsersExcept<T>(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findActive<T = IUser>(query: Filter<IUser>, options: FindOptions = {}) {
		Object.assign(query, { active: true });

		return this.find<T>(query, options);
	}

	findActiveByIds<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions) {
		const query = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find<T>(query, options);
	}

	findActiveByIdsOrUsernames<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions) {
		const query = {
			$or: [{ _id: { $in: userIds } }, { username: { $in: userIds } }],
			active: true,
		};

		return this.find<T>(query, options);
	}

	findByIds<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions) {
		const query = {
			_id: { $in: userIds },
		};

		return this.find<T>(query, options);
	}

	findOneByUsernameIgnoringCase<T = IUser>(username: IUser['username'], options?: FindOptions) {
		let usernameRegexp;
		if (typeof username === 'string') {
			usernameRegexp = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username: usernameRegexp ?? username };

		return this.findOne<T>(query, options);
	}

	async findOneByLDAPId<T = IUser>(id: string, attribute?: string) {
		const query: Record<string, string> = {
			'services.ldap.id': id,
		};

		if (attribute) {
			query['services.ldap.idAttribute'] = attribute;
		}

		return this.findOne<T>(query);
	}

	async findOneByAppId<T = IUser>(appId: string, options: FindOptions) {
		const query = { appId };

		return this.findOne<T>(query, options);
	}

	findLDAPUsers<T = IUser>(options?: FindOptions) {
		const query = { ldap: true };

		return this.find<T>(query, options);
	}

	findConnectedLDAPUsers<T = IUser>(options?: FindOptions) {
		const query = {
			'ldap': true,
			'services.resume.loginTokens': {
				$exists: true,
				$ne: [],
			},
		};

		return this.find<T>(query, options);
	}

	isUserInRole<T = IUser>(userId: IUser['_id'], roleId: IRole['_id']) {
		const query = {
			_id: userId,
			roles: roleId,
		};

		return this.findOne<T>(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department: string, ignoreAgentId: IUser['_id']) {
		const aggregate: Array<Record<string, unknown>> = [
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

		const [agent] = await this.col.aggregate<any>(aggregate).toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getLastAvailableAgentRouted(department: string, ignoreAgentId: IUser['_id']) {
		const aggregate: Array<Record<string, unknown>> = [
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

		const [agent] = await this.col.aggregate<any>(aggregate).toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async setLastRoutingTime(userId: IUser['_id']) {
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

	setLivechatStatusIf(userId: IUser['_id'], status: UserStatus, conditions: Filter<IUser> = {}, extraFields: Record<string, unknown> = {}) {
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

	async getAgentAndAmountOngoingChats(userId: IUser['_id']) {
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

		const [agent] = await this.col.aggregate<any>(aggregate).toArray();
		return agent;
	}

	findAllResumeTokensByUserId(userId: IUser['_id']) {
		return this.col
			.aggregate<IUser>([
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

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T = IUser>(
		termRegex: RegExp,
		exceptions: string[],
		conditions: Filter<IUser>,
		options: FindOptions,
	) {
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

		return this.find<T>(query, options);
	}

	countAllAgentsStatus({ departmentId = undefined }: { departmentId?: string }) {
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
		const params: Array<Record<string, unknown>> = [match];
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col.aggregate(params).toArray();
	}

	getTotalOfRegisteredUsersByDate({ start, end, options = {} }: { start: Date; end: Date; options?: FindOptions & { count?: number } }) {
		const params: Array<Record<string, unknown>> = [
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
		return this.col.aggregate<IUser>(params).toArray();
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

	updateStatusText(_id: IUser['_id'], statusText: string) {
		const update = {
			$set: {
				statusText,
			},
		};

		return this.update({ _id }, update);
	}

	updateStatusByAppId(appId: string, status: UserStatus) {
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
	updateStatusById(
		userId: IUser['_id'],
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: { statusDefault?: UserStatus; status: UserStatus; statusConnection: UserStatus; statusText?: string },
	) {
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

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: string) {
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

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: string, agentId: IUser['_id']) {
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

	addBusinessHourByAgentIds(agentIds: Array<IUser['_id']> = [], businessHourId: string) {
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

	removeBusinessHourByAgentIds(agentIds: Array<IUser['_id']> = [], businessHourId: string) {
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

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: Array<IUser['_id']> = [], businessHourId: string) {
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

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: Array<IUser['_id']> = [], businessHourId: string) {
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

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: Array<string>) {
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

	updateLivechatStatusBasedOnBusinessHours(userIds: Array<IUser['_id']> = []) {
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

	setLivechatStatusActiveBasedOnBusinessHours(userId: IUser['_id']) {
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

	async isAgentWithinBusinessHours(agentId: IUser['_id']) {
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

		const update: UpdateFilter<IUser> = {
			$unset: {
				openBusinessHours: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	resetTOTPById(userId: IUser['_id']) {
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

	unsetOneLoginToken(_id: IUser['_id'], token: string) {
		const update = {
			$pull: {
				'services.resume.loginTokens': { hashedToken: token },
			},
		};

		return this.col.updateOne({ _id }, update);
	}

	unsetLoginTokens(userId: IUser['_id']) {
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

	removeNonPATLoginTokensExcept(userId: IUser['_id'], authToken: string) {
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

	removeRoomsByRoomIdsAndUserId(rids: Array<IRoom['_id']>, userId: IUser['_id']) {
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

	removeRolesByUserId(uid: IUser['_id'], roles: Array<IRole['_id']>) {
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

	async isUserInRoleScope(uid: IUser['_id']) {
		const query = {
			_id: uid,
		};

		const options = {
			projection: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}

	addBannerById(_id: IUser['_id'], banner: Exclude<IUser['banners'], undefined>[string]) {
		const query = {
			_id,
			[`banners.${banner.id}.read`]: {
				$ne: true,
			},
		};

		const update: UpdateFilter<IUser['banners']> = {
			$set: {
				[`banners.${banner.id}`]: banner,
			},
		};

		return this.updateOne(query, update);
	}

	// Voip functions
	findOneByAgentUsername(username: IUser['username'], options: FindOptions) {
		const query = { username, roles: 'livechat-agent' };

		return this.findOne(query, options);
	}

	findOneByExtension(extension: IUser['extension'], options: FindOptions) {
		const query = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions<T = IUser>(extensions: Array<IUser['extension']>, options: FindOptions) {
		const query = {
			extension: {
				$in: extensions,
			},
		};

		return this.find<T>(query, options);
	}

	getVoipExtensionByUserId(userId: IUser['_id'], options: FindOptions) {
		const query = {
			_id: userId,
			extension: { $exists: true },
		};
		return this.findOne(query, options);
	}

	setExtension(userId: IUser['_id'], extension: IUser['extension']) {
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

	unsetExtension(userId: IUser['_id']) {
		const query = {
			_id: userId,
		};
		const update: UpdateFilter<IUser> = {
			$unset: {
				extension: true,
			},
		};
		return this.update(query, update);
	}

	getAvailableAgentsIncludingExt<T = ILivechatAgent>(includeExt: IUser['extension'], text: string | undefined, options?: FindOptions) {
		const query = {
			roles: { $in: ['livechat-agent'] },
			$and: [
				...(text?.trim()
					? [{ $or: [{ username: new RegExp(escapeRegExp(text), 'i') }, { name: new RegExp(escapeRegExp(text), 'i') }] }]
					: []),
				{ $or: [{ extension: { $exists: false } }, ...(includeExt ? [{ extension: includeExt }] : [])] },
			],
		};

		return this.findPaginated<T>(query, options);
	}

	findActiveUsersTOTPEnable(options: FindOptions) {
		const query = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.find(query, options);
	}

	findActiveUsersEmail2faEnable(options: FindOptions) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}

	setAsFederated(uid: IUser['_id']) {
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

	removeRoomByRoomId(rid: IRoom['_id']) {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
		);
	}

	findOneByResetToken<T = IUser>(token: string, options?: FindOptions) {
		return this.findOne<T>({ 'services.password.reset.token': token }, options);
	}

	async setFederationAvatarUrlById(userId: IUser['_id'], federationAvatarUrl: string) {
		await this.updateOne(
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

	async findSearchedServerNamesByUserId(userId: IUser['_id']) {
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

		return user?.federation?.searchedServerNames || [];
	}

	addServerNameToSearchedServerNamesList(userId: IUser['_id'], serverName: string) {
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

	removeServerNameFromSearchedServerNamesList(userId: IUser['_id'], serverName: string) {
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
}
