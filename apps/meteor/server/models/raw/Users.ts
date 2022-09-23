import type {
	ILivechatAgent,
	ILivechatBusinessHour,
	ILivechatDepartment,
	ILoginToken,
	IRole,
	IRoom,
	IUser,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Db, Collection, UpdateResult, FindOptions, FindCursor, Filter, ModifyResult, Document, UpdateFilter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

type AggregationParameter<T> = Exclude<Parameters<Collection<T>['aggregate']>[0], undefined>;
type AggregationLimitStage<T> = Parameters<ReturnType<Collection<T>['aggregate']>['limit']>[0];
type AggregationSortStage<T> = Parameters<ReturnType<Collection<T>['aggregate']>['sort']>[0];

// @ts-ignore
class UsersRaw extends BaseRaw<IUser> {
	constructor(db: Db, trash: Collection<RocketChatRecordDeleted<IUser>>) {
		super(db, 'users', trash, {
			collectionNameResolver(name: string) {
				return name;
			},
		});
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id'][]} roles list of role ids
	 */
	addRolesByUserId(uid: IUser['_id'], roles: Array<IRole['_id']>): Promise<UpdateResult> {
		// TODO make sure roles is an array in every calling function

		const query: Filter<IUser> = {
			_id: uid,
		};

		const update: UpdateFilter<IUser> = {
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
	findUsersInRoles(roles: Array<IRole['_id']>, _scope: IRole['scope'], options: FindOptions<IUser>): FindCursor<IUser> {
		// TODO roles

		const query: Filter<IUser> = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findPaginatedUsersInRoles(roles: Array<IRole['_id']>, options: FindOptions<IUser>): FindPaginated<FindCursor<IUser>> {
		// TODO roles

		const query: Filter<IUser> = {
			roles: { $in: roles },
		};

		return this.findPaginated(query, options);
	}

	findOneByUsername(username: IUser['username'], options: FindOptions<IUser>): Promise<IUser | null> {
		const query: Filter<IUser> = { username };

		return this.findOne(query, options);
	}

	findOneAgentById(_id: ILivechatAgent['_id'], options: FindOptions<ILivechatAgent>): Promise<ILivechatAgent> {
		const query: Filter<IUser> = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne(query, options) as Promise<ILivechatAgent>;
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findUsersInRolesWithQuery(roles: Array<IRole['_id']>, query: Filter<IUser>, options: FindOptions<IUser>): FindCursor<IUser> {
		// TODO roles

		Object.assign(query, { roles: { $in: roles } });

		return this.find(query, options);
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findPaginatedUsersInRolesWithQuery(
		roles: Array<IRole['_id']>,
		query: Filter<IUser>,
		options: FindOptions<IUser>,
	): FindPaginated<FindCursor<IUser>> {
		// TODO roles

		Object.assign(query, { roles: { $in: roles } });

		return this.findPaginated(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase(
		username: IUser['_id'] | RegExp,
		rid: IRoom['_id'],
		options: FindOptions<IUser>,
	): Promise<IUser | null> {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query: Filter<IUser> = {
			__rooms: rid,
			username,
		};

		return this.findOne(query, options);
	}

	findOneByIdAndLoginHashedToken(_id: IUser['_id'], token: string, options: FindOptions<IUser>): Promise<IUser | null> {
		const query: Filter<IUser> = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findByActiveUsersExcept(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<IUser>,
		searchFields: any,
		extraQuery = [],
		{ startsWith = false, endsWith = false } = {},
	): FindCursor<IUser> {
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

		const orStmt = (searchFields || []).reduce(function (acc: any, el: any) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);

		const query: Filter<IUser> = {
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
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<IUser>,
		searchFields: any,
		extraQuery: Filter<IUser>[] = [],
		{ startsWith = false, endsWith = false } = {},
	): FindPaginated<FindCursor<IUser>> {
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

		const orStmt = (searchFields || []).reduce(function (acc: any, el: any) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);

		const query: Filter<IUser> = {
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

	findPaginatedByActiveLocalUsersExcept(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<IUser>,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<IUser>> {
		const extraQuery: Filter<IUser>[] = [
			{
				$or: [{ federation: { $exists: false } }, { 'federation.origin': localDomain }],
			},
		];
		return this.findPaginatedByActiveUsersExcept(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findPaginatedByActiveExternalUsersExcept(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<IUser>,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<IUser>> {
		const extraQuery: Filter<IUser>[] = [{ federation: { $exists: true } }, { 'federation.origin': { $ne: localDomain } }];
		return this.findPaginatedByActiveUsersExcept(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findActive(query: Filter<IUser>, options: FindOptions<IUser>): FindCursor<IUser> {
		Object.assign(query, { active: true });

		return this.find(query, options);
	}

	findActiveByIds(userIds: Array<IUser['_id']>, options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find(query, options);
	}

	findActiveByIdsOrUsernames(userIds: Array<IUser['_id']>, options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			$or: [{ _id: { $in: userIds } }, { username: { $in: userIds } }],
			active: true,
		};

		return this.find(query, options);
	}

	findByIds(userIds: Array<IUser['_id']>, options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			_id: { $in: userIds },
		};

		return this.find(query, options);
	}

	findOneByUsernameIgnoringCase(username: NonNullable<IUser['username']> | RegExp, options: FindOptions<IUser>): Promise<IUser | null> {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query: Filter<IUser> = { username };

		return this.findOne(query, options);
	}

	async findOneByLDAPId(id: IUser['_id'], attribute = undefined): Promise<IUser | null> {
		const query: Filter<IUser> = {
			'services.ldap.id': id,
		};

		if (attribute) {
			query['services.ldap.idAttribute'] = attribute;
		}

		return this.findOne(query);
	}

	async findOneByAppId(appId: string, options: FindOptions<IUser>): Promise<IUser | null> {
		const query: Filter<IUser> = { appId };

		return this.findOne(query, options);
	}

	findLDAPUsers(options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = { ldap: true };

		return this.find(query, options);
	}

	findConnectedLDAPUsers(options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			'ldap': true,
			'services.resume.loginTokens': {
				$exists: true,
				$ne: [],
			},
		};

		return this.find(query, options);
	}

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<{ roles: IUser['roles'] } | null> {
		const query: Filter<IUser> = {
			_id: userId,
			roles: roleId,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains(): Promise<Array<string>> {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(
		department: ILivechatDepartment['_id'],
		ignoreAgentId: ILivechatAgent['_id'],
	): Promise<{
		agentId: ILivechatAgent['_id'];
		username: ILivechatAgent['username'];
		lastRoutingTime: ILivechatAgent['lastRoutingTime'];
		departments: ILivechatDepartment['_id'][];
		count: number;
	}> {
		const aggregate: AggregationParameter<IUser> = [
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

		const [agent] = await this.col
			.aggregate<{
				agentId: ILivechatAgent['_id'];
				username: ILivechatAgent['username'];
				lastRoutingTime: ILivechatAgent['lastRoutingTime'];
				departments: ILivechatDepartment['_id'][];
				count: number;
			}>(aggregate)
			.toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getLastAvailableAgentRouted(
		department: ILivechatDepartment['_id'],
		ignoreAgentId: ILivechatAgent['_id'],
	): Promise<{
		agentId: ILivechatAgent['_id'];
		username: ILivechatAgent['username'];
		lastRoutingTime: ILivechatAgent['lastRoutingTime'];
		departments: ILivechatDepartment['_id'][];
	}> {
		const aggregate: AggregationParameter<IUser> = [
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

		const [agent] = await this.col
			.aggregate<{
				agentId: ILivechatAgent['_id'];
				username: ILivechatAgent['username'];
				lastRoutingTime: ILivechatAgent['lastRoutingTime'];
				departments: ILivechatDepartment['_id'][];
			}>(aggregate)
			.toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async setLastRoutingTime(userId: ILivechatAgent['_id']): Promise<ModifyResult<IUser>['value']> {
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

	setLivechatStatusIf(
		userId: ILivechatAgent['_id'],
		status: ILivechatAgent['statusLivechat'],
		conditions = {},
		extraFields = {},
	): Promise<UpdateResult> {
		// TODO: Create class Agent
		const query: Filter<ILivechatAgent> = {
			_id: userId,
			...conditions,
		};

		const update: UpdateFilter<ILivechatAgent> = {
			$set: {
				statusLivechat: status,
				...extraFields,
			},
		};

		// FIXME move to separate model
		return this.updateOne(query as any, update);
	}

	async getAgentAndAmountOngoingChats(userId: ILivechatAgent['_id']): Promise<{
		'agentId': ILivechatAgent['_id'];
		'username': ILivechatAgent['username'];
		'lastAssignTime': ILivechatAgent['lastAssignTime'];
		'lastRoutingTime': ILivechatAgent['lastRoutingTime'];
		'queueInfo.chats': number;
	}> {
		const aggregate: AggregationParameter<ILivechatAgent> = [
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

		const [agent] = await this.col
			.aggregate<{
				'agentId': ILivechatAgent['_id'];
				'username': ILivechatAgent['username'];
				'lastAssignTime': ILivechatAgent['lastAssignTime'];
				'lastRoutingTime': ILivechatAgent['lastRoutingTime'];
				'queueInfo.chats': number;
			}>(aggregate)
			.toArray();
		return agent;
	}

	findAllResumeTokensByUserId(userId: IUser['_id']): Promise<Array<{ tokens: ILoginToken[] }>> {
		return this.col
			.aggregate<{ tokens: ILoginToken[] }>([
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

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(
		termRegex: RegExp,
		exceptions: NonNullable<IUser['username'][]>,
		conditions: Filter<IUser>,
		options: FindOptions<IUser>,
	): FindCursor<IUser> {
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

		const query: Filter<IUser> = {
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

	countAllAgentsStatus({ departmentId = undefined }): Promise<
		Array<{
			offline: number;
			away: number;
			busy: number;
			available: number;
		}>
	> {
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
		const params: AggregationParameter<ILivechatAgent> = [match];
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col
			.aggregate<{
				offline: number;
				away: number;
				busy: number;
				available: number;
			}>(params)
			.toArray();
	}

	getTotalOfRegisteredUsersByDate({
		start,
		end,
		options,
	}: {
		start: Date;
		end: Date;
		options: {
			sort: AggregationSortStage<IUser>;
			count: AggregationLimitStage<IUser>;
		};
	}): Promise<
		Array<{
			_id: IUser['_id'];
			date: Date;
			users: number;
			type: 'users';
		}>
	> {
		const params: AggregationParameter<IUser> = [
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
		return this.col
			.aggregate<{
				_id: IUser['_id'];
				date: Date;
				users: number;
				type: 'users';
			}>(params)
			.toArray();
	}

	getUserLanguages(): Promise<
		Array<{
			_id: IUser['language'];
			total: number;
		}>
	> {
		const pipeline: AggregationParameter<IUser> = [
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

		return this.col
			.aggregate<{
				_id: IUser['language'];
				total: number;
			}>(pipeline)
			.toArray();
	}

	updateStatusText(_id: IUser['_id'], statusText: string): Promise<UpdateResult> {
		const update: UpdateFilter<IUser> = {
			$set: {
				statusText,
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateStatusByAppId(appId: string, status: IUser['status']): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			appId,
			status: { $ne: status },
		};

		const update: UpdateFilter<IUser> = {
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
	updateStatusById(
		userId: IUser['_id'],
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: {
			statusDefault: IUser['statusDefault'];
			status: IUser['status'];
			statusConnection: IUser['statusConnection'];
			statusText: IUser['statusText'];
		},
	): Promise<UpdateResult> {
		const query: Filter<IUser> = {
			_id: userId,
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				status,
				statusConnection,
				...(statusDefault && { statusDefault }),
				...(statusText && {
					statusText: String(statusText).trim().substring(0, 120),
				}),
			},
		};

		// We don't want to update the _updatedAt field on this operation,
		// so we can check if the status update triggered a change
		return this.col.updateOne(query, update);
	}

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: ILivechatBusinessHour['_id'][]): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			roles: 'livechat-agent',
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.updateMany(query, update);
	}

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(
		businessHourIds: ILivechatBusinessHour['_id'][],
		agentId: ILivechatAgent['_id'],
	): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			_id: agentId,
			roles: 'livechat-agent',
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.updateMany(query, update);
	}

	addBusinessHourByAgentIds(
		agentIds: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	removeBusinessHourByAgentIds(
		agentIds: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update: UpdateFilter<IUser> = {
			$pull: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	openBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'available',
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	closeBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update: UpdateFilter<IUser> = {
			$pull: {
				openBusinessHours: businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: ILivechatBusinessHour['_id'][]): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			roles: 'livechat-agent',
		};

		const update: UpdateFilter<IUser> = {
			$pull: {
				openBusinessHours: { $in: businessHourIds },
			},
		};

		return this.updateMany(query, update);
	}

	updateLivechatStatusBasedOnBusinessHours(userIds: IUser['_id'][]): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
			$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
			roles: 'livechat-agent',
			...(Array.isArray(userIds) && userIds.length > 0 && { _id: { $in: userIds } }),
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'not-available',
			},
		};

		return this.updateMany(query, update);
	}

	setLivechatStatusActiveBasedOnBusinessHours(userId: IUser['_id']): Promise<UpdateResult> {
		const query: Filter<IUser> = {
			_id: userId,
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				statusLivechat: 'available',
			},
		};

		return this.updateOne(query, update);
	}

	async isAgentWithinBusinessHours(agentId: ILivechatAgent['_id']): Promise<boolean> {
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

	removeBusinessHoursFromAllUsers(): Promise<Document | UpdateResult> {
		const query: Filter<IUser> = {
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

		return this.updateMany(query, update);
	}

	resetTOTPById(userId: IUser['_id']): Promise<UpdateResult> {
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

	unsetOneLoginToken(_id: IUser['_id'], token: ILoginToken): Promise<UpdateResult> {
		const update: UpdateFilter<IUser> = {
			$pull: {
				'services.resume.loginTokens': { hashedToken: token },
			},
		};

		return this.col.updateOne({ _id }, update);
	}

	unsetLoginTokens(userId: IUser['_id']): Promise<UpdateResult> {
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

	removeNonPATLoginTokensExcept(userId: IUser['_id'], authToken: ILoginToken): Promise<UpdateResult> {
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

	removeRoomsByRoomIdsAndUserId(rids: IRoom['_id'][], userId: IUser['_id']): Promise<UpdateResult | Document> {
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
	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult> {
		const query: Filter<IUser> = {
			_id: uid,
		};

		const update: UpdateFilter<IUser> = {
			$pullAll: {
				roles,
			},
		};

		return this.updateOne(query, update);
	}

	async isUserInRoleScope(uid: IUser['_id']): Promise<boolean> {
		const query: Filter<IUser> = {
			_id: uid,
		};

		const options: FindOptions<IUser> = {
			projection: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}

	// FIXME is IBanner the right one?
	// banner._id ???
	// or am i missign something
	addBannerById(_id: IUser['_id'], banner: any): Promise<UpdateResult> {
		const query: Filter<IUser> = {
			_id,
			[`banners.${banner.id}.read`]: {
				$ne: true,
			},
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				[`banners.${banner.id}`]: banner,
			},
		};

		return this.updateOne(query, update);
	}

	// Voip functions
	findOneByAgentUsername(username: ILivechatAgent['username'], options: FindOptions<ILivechatAgent>): Promise<ILivechatAgent | null> {
		const query: Filter<ILivechatAgent> = { username, roles: 'livechat-agent' };

		return this.findOne(query as any, options);
	}

	findOneByExtension(extension: ILivechatAgent['extension'], options: FindOptions<ILivechatAgent>): Promise<IUser | null> {
		const query: Filter<IUser> = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions(
		extensions: NonNullable<ILivechatAgent['extension']>[],
		options: FindOptions<ILivechatAgent>,
	): FindCursor<ILivechatAgent> {
		const query: Filter<ILivechatAgent> = {
			extension: {
				$in: extensions,
			},
		};

		// FIXME move all these to LivechatRaw
		return this.find(query as Filter<IUser>, options);
	}

	getVoipExtensionByUserId(userId: IUser['_id'], options: FindOptions<ILivechatAgent>): Promise<IUser | null> {
		const query: Filter<ILivechatAgent> = {
			_id: userId,
			extension: { $exists: true },
		};
		return this.findOne(query as any, options);
	}

	setExtension(userId: ILivechatAgent['_id'], extension: ILivechatAgent['extension']): Promise<UpdateResult> {
		const query: Filter<ILivechatAgent> = {
			_id: userId,
		};

		const update: UpdateFilter<ILivechatAgent> = {
			$set: {
				extension,
			},
		};
		return this.updateOne(query as any, update);
	}

	unsetExtension(userId: ILivechatAgent['_id']): Promise<UpdateResult> {
		const query: Filter<ILivechatAgent> = {
			_id: userId,
		};
		const update: UpdateFilter<ILivechatAgent> = {
			$unset: {
				extension: true,
			},
		};
		return this.updateOne(query as any, update);
	}

	getAvailableAgentsIncludingExt(
		includeExt: ILivechatAgent['extension'],
		text: string,
		options: FindOptions<ILivechatAgent>,
	): FindPaginated<FindCursor<ILivechatAgent>> {
		const query: Filter<IUser> = {
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

	findActiveUsersTOTPEnable(options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.find(query, options);
	}

	findActiveUsersEmail2faEnable(options: FindOptions<IUser>): FindCursor<IUser> {
		const query: Filter<IUser> = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}

	setAsFederated(uid: IUser['_id']): Promise<UpdateResult> {
		const query: Filter<IUser> = {
			_id: uid,
		};

		const update: UpdateFilter<IUser> = {
			$set: {
				federated: true,
			},
		};
		return this.updateOne(query, update);
	}

	removeRoomByRoomId(rid: IRoom['_id']): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
		);
	}

	findOneByResetToken(token: ILoginToken, options: FindOptions<IUser>): Promise<IUser | null> {
		return this.findOne({ 'services.password.reset.token': token }, options);
	}
}
