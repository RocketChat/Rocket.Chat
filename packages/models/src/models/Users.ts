import type {
	AvailableAgentsAggregation,
	AtLeast,
	DeepWritable,
	ILivechatAgent,
	ILoginToken,
	IMeteorLoginToken,
	IPersonalAccessToken,
	IRole,
	IRoom,
	IUser,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, UserStatus } from '@rocket.chat/core-typings';
import type { DefaultFields, InsertionModel, IUsersModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	Collection,
	Db,
	Filter,
	FindOptions,
	IndexDescription,
	Document,
	UpdateFilter,
	UpdateOptions,
	FindCursor,
	SortDirection,
	UpdateResult,
	FindOneAndUpdateOptions,
} from 'mongodb';

import { Subscriptions } from '../index';
import { BaseRaw } from './BaseRaw';

const queryStatusAgentOnline = (extraFilters = {}, isLivechatEnabledWhenAgentIdle?: boolean): Filter<IUser> => ({
	statusLivechat: 'available',
	roles: 'livechat-agent',
	// ignore deactivated users
	active: true,
	...(!isLivechatEnabledWhenAgentIdle && {
		$or: [
			{
				status: {
					$exists: true,
					$ne: UserStatus.OFFLINE,
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

export class UsersRaw extends BaseRaw<IUser, DefaultFields<IUser>> implements IUsersModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUser>>) {
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
	modelIndexes(): IndexDescription[] {
		return [
			{ key: { __rooms: 1 }, sparse: true },
			{ key: { roles: 1 }, sparse: true },
			{ key: { name: 1 } },
			{ key: { bio: 1 }, sparse: true },
			{ key: { nickname: 1 }, sparse: true },
			{ key: { createdAt: 1 } },
			{ key: { lastLogin: 1 } },
			{ key: { status: 1 } },
			{ key: { statusText: 1 } },
			{ key: { statusConnection: 1 }, sparse: true },
			{ key: { appId: 1 }, sparse: true },
			{ key: { type: 1 } },
			{ key: { federated: 1 }, sparse: true },
			{ key: { federation: 1 }, sparse: true },
			{ key: { isRemote: 1 }, sparse: true },
			{ key: { 'services.saml.inResponseTo': 1 } },
			{ key: { openBusinessHours: 1 }, sparse: true },
			{ key: { statusLivechat: 1 }, sparse: true },
			{ key: { extension: 1 }, sparse: true, unique: true },
			{ key: { freeSwitchExtension: 1 }, sparse: true, unique: true },
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
			{
				key: { active: 1, lastLogin: 1 },
				partialFilterExpression: { active: true, lastLogin: { $exists: true } },
			},
		];
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id'][]} roles list of role ids
	 */
	addRolesByUserId(uid: string, roles: string | string[]) {
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
	findUsersInRoles(roles: IRole['_id'][] | IRole['_id'], _scope?: null, options?: FindOptions<IUser>) {
		roles = ([] as string[]).concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	countUsersInRoles(roles: IRole['_id'][] | IRole['_id']) {
		roles = ([] as string[]).concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.countDocuments(query);
	}

	findPaginatedUsersInRoles(roles: IRole['_id'][] | IRole['_id'], options?: FindOptions<IUser>) {
		roles = ([] as string[]).concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.findPaginated(query, options);
	}

	findOneByUsername<T extends Document = IUser>(username: string, options?: FindOptions<IUser>) {
		const query = { username };

		return this.findOne<T>(query, options);
	}

	findOneAgentById<T extends Document = ILivechatAgent>(_id: IUser['_id'], options?: FindOptions<IUser>) {
		const query = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne<T>(query, options);
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findUsersInRolesWithQuery(roles: IRole['_id'][] | IRole['_id'], query: Filter<IUser>, options?: FindOptions<IUser>) {
		roles = ([] as string[]).concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.find(query, options);
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findPaginatedUsersInRolesWithQuery<T extends Document = IUser>(
		roles: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: FindOptions<IUser>,
	) {
		roles = ([] as string[]).concat(roles);

		Object.assign(query, { roles: { $in: roles } });

		return this.findPaginated<T>(query, options);
	}

	findAgentsWithDepartments<T extends Document = ILivechatAgent>(
		role: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: FindOptions<IUser>,
	): Promise<{ sortedResults: (T & { departments: string[] })[]; totalCount: { total: number }[] }[]> {
		const roles = ([] as string[]).concat(role);

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
					sortedResults: [{ $sort: options?.sort }, { $skip: options?.skip }, options?.limit && { $limit: options.limit }],
					totalCount: [{ $group: { _id: null, total: { $sum: 1 } } }],
				},
			},
		];

		return this.col.aggregate<{ sortedResults: (T & { departments: string[] })[]; totalCount: { total: number }[] }>(aggregate).toArray();
	}

	findOneByUsernameAndRoomIgnoringCase(username: string | RegExp, rid: string, options?: FindOptions<IUser>) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = {
			__rooms: rid,
			username,
		};

		return this.findOne(query, options);
	}

	findOneByIdAndLoginHashedToken(_id: IUser['_id'], token: string, options: FindOptions<IUser> = {}) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findByActiveUsersExcept(
		searchTerm: string,
		exceptions: string[],
		options?: FindOptions<IUser>,
		searchFields?: string[],
		extraQuery: Filter<IUser>[] = [],
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

		const orStmt = (searchFields || []).reduce(
			(acc, el) => {
				acc.push({ [el.trim()]: termRegex });
				return acc;
			},
			[] as Record<string, RegExp>[],
		);

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

	findPaginatedByActiveUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		searchFields: string[] = [],
		extraQuery: Filter<IUser>[] = [],
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

		const orStmt = (searchFields || []).reduce(
			(acc, el) => {
				acc.push({ [el.trim()]: termRegex });
				return acc;
			},
			[] as Record<string, RegExp>[],
		);

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

		return this.findPaginated<T>(query, options);
	}

	findPaginatedByActiveLocalUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		forcedSearchFields?: string[],
		localDomain?: string,
	) {
		const extraQuery = [
			{
				$or: [{ federation: { $exists: false } }, { 'federation.origin': localDomain }],
			},
		];
		return this.findPaginatedByActiveUsersExcept<T>(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findPaginatedByActiveExternalUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		forcedSearchFields?: string[],
		localDomain?: string,
	) {
		const extraQuery = [{ federation: { $exists: true } }, { 'federation.origin': { $ne: localDomain } }];
		return this.findPaginatedByActiveUsersExcept<T>(searchTerm, exceptions, options, forcedSearchFields, extraQuery);
	}

	findActive(query: Filter<IUser>, options: FindOptions<IUser> = {}) {
		Object.assign(query, { active: true });

		return this.find(query, options);
	}

	findActiveByIds(userIds: IUser['_id'][], options: FindOptions<IUser> = {}) {
		const query = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find(query, options);
	}

	findActiveByIdsOrUsernames(userIds: IUser['_id'][], options: FindOptions<IUser> = {}) {
		const query = {
			$or: [{ _id: { $in: userIds } }, { username: { $in: userIds } }],
			active: true,
		};

		return this.find(query, options);
	}

	findByIds<T extends Document = IUser>(userIds: IUser['_id'][], options: FindOptions<IUser> = {}) {
		const query = {
			_id: { $in: userIds },
		};

		return this.find<T>(query, options);
	}

	findOneByImportId<T extends Document = IUser>(_id: IUser['_id'], options?: FindOptions<IUser>) {
		return this.findOne<T>({ importIds: _id }, options);
	}

	findOneByUsernameIgnoringCase<T extends Document = IUser>(username: IUser['username'], options?: FindOptions<IUser>) {
		if (!username) {
			throw new Error('invalid username');
		}

		const query = { username };

		return this.findOne<T>(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneWithoutLDAPByUsernameIgnoringCase<T extends Document = IUser>(username: string, options?: FindOptions<IUser>) {
		const expression = new RegExp(`^${escapeRegExp(username)}$`, 'i');

		const query = {
			'username': expression,
			'services.ldap': {
				$exists: false,
			},
		};

		return this.findOne<T>(query, options);
	}

	async findOneByLDAPId<T extends Document = IUser>(id: string, attribute?: string) {
		const query = {
			'services.ldap.id': id,
			...(attribute && { 'services.ldap.idAttribute': attribute }),
		};

		return this.findOne<T>(query);
	}

	async findOneByAppId<T extends Document = IUser>(appId: string, options?: FindOptions<IUser>) {
		const query = { appId };

		return this.findOne<T>(query, options);
	}

	findLDAPUsers<T extends Document = IUser>(options?: FindOptions<IUser>) {
		const query = { ldap: true };

		return this.find<T>(query, options);
	}

	findLDAPUsersExceptIds<T extends Document = IUser>(userIds: IUser['_id'][], options: FindOptions<IUser> = {}) {
		const query = {
			ldap: true,
			_id: {
				$nin: userIds,
			},
		};

		return this.find<T>(query, options);
	}

	findConnectedLDAPUsers<T extends Document = IUser>(options?: FindOptions<IUser>) {
		const query = {
			'ldap': true,
			'services.resume.loginTokens': {
				$exists: true,
				$ne: [],
			},
		};

		return this.find<T>(query, options);
	}

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']) {
		const query = {
			_id: userId,
			roles: roleId,
		};

		return this.findOne<Pick<IUser, 'roles' | '_id'>>(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
	): Promise<{ agentId: string; username?: string; lastRoutingTime?: Date; count: number; departments?: any[] }> {
		const match = queryStatusAgentOnline(
			{ ...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }), ...(ignoreUsernames?.length && { username: { $nin: ignoreUsernames } }) },
			isEnabledWhenAgentIdle,
		);

		const departmentFilter = department
			? [
					{
						$lookup: {
							from: 'rocketchat_livechat_department_agents',
							let: { userId: '$_id' },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ['$$userId', '$agentId'] }, { $eq: ['$departmentId', department] }],
										},
									},
								},
							],
							as: 'department',
						},
					},
					{
						$match: { department: { $size: 1 } },
					},
				]
			: [];

		const aggregate: Document[] = [
			{ $match: match },
			...departmentFilter,
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
				$project: {
					agentId: '$_id',
					username: 1,
					lastRoutingTime: 1,
					count: { $size: '$subs' },
				},
			},
			{ $sort: { count: 1, lastRoutingTime: 1, username: 1 } },
			{ $limit: 1 },
		];

		const [agent] = await this.col
			.aggregate<{ agentId: string; username?: string; lastRoutingTime?: Date; count: number }>(aggregate)
			.toArray();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getLastAvailableAgentRouted(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
	): Promise<{ agentId: string; username?: string; lastRoutingTime?: Date; departments?: any[] }> {
		const match = queryStatusAgentOnline(
			{ ...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }), ...(ignoreUsernames?.length && { username: { $nin: ignoreUsernames } }) },
			isEnabledWhenAgentIdle,
		);
		const departmentFilter = department
			? [
					{
						$lookup: {
							from: 'rocketchat_livechat_department_agents',
							let: { userId: '$_id' },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ['$$userId', '$agentId'] }, { $eq: ['$departmentId', department] }],
										},
									},
								},
							],
							as: 'department',
						},
					},
					{
						$match: { department: { $size: 1 } },
					},
				]
			: [];

		const aggregate: Document[] = [
			{ $match: match },
			...departmentFilter,
			{ $project: { agentId: '$_id', username: 1, lastRoutingTime: 1 } },
			{ $sort: { lastRoutingTime: 1, username: 1 } },
		];

		aggregate.push({ $limit: 1 });

		const [agent] = await this.col.aggregate<{ agentId: string; username?: string; lastRoutingTime?: Date }>(aggregate).toArray();
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
		return result;
	}

	setLivechatStatusIf(
		userId: IUser['_id'],
		status: ILivechatAgentStatus,
		conditions: Filter<IUser> = {},
		extraFields: UpdateFilter<IUser>['$set'] = {},
	) {
		// TODO: Create class Agent
		const query: Filter<IUser> = {
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

	async getAgentAndAmountOngoingChats(
		userId: IUser['_id'],
		departmentId?: string,
	): Promise<{
		agentId: string;
		username?: string;
		lastAssignTime?: Date;
		lastRoutingTime?: Date;
		queueInfo: { chats: number; chatsForDepartment?: number };
	}> {
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
					...(departmentId
						? {
								'queueInfo.chatsForDepartment': {
									$size: {
										$filter: {
											input: '$subs',
											as: 'sub',
											cond: {
												$and: [
													{ $eq: ['$$sub.t', 'l'] },
													{ $eq: ['$$sub.open', true] },
													{ $ne: ['$$sub.onHold', true] },
													{ $eq: ['$$sub.department', departmentId] },
												],
											},
										},
									},
								},
							}
						: {}),
				},
			},
			{ $sort: { 'queueInfo.chats': 1, 'lastAssignTime': 1, 'lastRoutingTime': 1, 'username': 1 } },
		];

		const [agent] = await this.col
			.aggregate<{
				agentId: string;
				username?: string;
				lastAssignTime?: Date;
				lastRoutingTime?: Date;
				queueInfo: { chats: number };
			}>(aggregate)
			.toArray();
		return agent;
	}

	findAllResumeTokensByUserId(userId: IUser['_id']): Promise<{ tokens: IMeteorLoginToken[] }[]> {
		return this.col
			.aggregate<{ tokens: IMeteorLoginToken[] }>([
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

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T extends Document = IUser>(
		termRegex: { $regex: string; $options: string } | RegExp,
		exceptions?: string[],
		conditions?: Filter<IUser>,
		options?: FindOptions<IUser>,
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
				{
					...conditions,
				},
			],
		};

		return this.find<T>(query, options);
	}

	countAllAgentsStatus({
		departmentId,
	}: {
		departmentId?: string;
	}): Promise<{ offline: number; away: number; busy: number; available: number }[]> {
		const match: Document = {
			$match: {
				roles: { $in: ['livechat-agent'] },
			},
		};
		const group: Document = {
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
		const lookup: Document = {
			$lookup: {
				from: 'rocketchat_livechat_department_agents',
				localField: '_id',
				foreignField: 'agentId',
				as: 'departments',
			},
		};
		const unwind: Document = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsMatch: Document = {
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
		return this.col.aggregate<{ offline: number; away: number; busy: number; available: number }>(params).toArray();
	}

	getTotalOfRegisteredUsersByDate({
		start,
		end,
		options = {},
	}: {
		start: Date;
		end: Date;
		options?: { count?: number; sort?: Record<string, 1 | -1> };
	}): Promise<{ date: string; users: number; type: 'users' }[]> {
		const params: Document[] = [
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
		return this.col.aggregate<{ date: string; users: number; type: 'users' }>(params).toArray();
	}

	getUserLanguages(): Promise<{ _id: string; total: number }[]> {
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

		return this.col.aggregate<{ _id: string; total: number }>(pipeline).toArray();
	}

	updateStatusText(_id: IUser['_id'], statusText: string, options?: UpdateOptions) {
		const update = {
			$set: {
				statusText,
			},
		};

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	updateStatus(_id: IUser['_id'], status: UserStatus) {
		const update = {
			$set: {
				status,
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateStatusAndStatusDefault(_id: IUser['_id'], status: UserStatus, statusDefault: UserStatus) {
		const update = {
			$set: {
				status,
				statusDefault,
			},
		};

		return this.updateOne({ _id }, update);
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

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: string[]) {
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

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: string[], agentId: IUser['_id']) {
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

	addBusinessHourByAgentIds(agentIds: IUser['_id'][] = [], businessHourId: string) {
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

	findOnlineButNotAvailableAgents<T extends Document = ILivechatAgent>(userIds?: IUser['_id'][]) {
		const query = {
			...(userIds && { _id: { $in: userIds } }),
			roles: 'livechat-agent',
			// Exclude away users
			status: UserStatus.ONLINE,
			// Exclude users that are already available, maybe due to other business hour
			statusLivechat: ILivechatAgentStatus.NOT_AVAILABLE,
		};

		return this.find<T>(query);
	}

	removeBusinessHourByAgentIds(agentIds: IUser['_id'][] = [], businessHourId: string) {
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

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: IUser['_id'][] = [], businessHourId: string) {
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

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: IUser['_id'][] = [], businessHourId: string) {
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

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: string[]) {
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

	findAgentsAvailableWithoutBusinessHours(userIds: IUser['_id'][] = []) {
		return this.find<Pick<ILivechatAgent, '_id' | 'openBusinessHours'>>(
			{
				$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
				$and: [{ roles: 'livechat-agent' }, { roles: { $ne: 'bot' } }],
				// exclude deactivated users
				active: true,
				// Avoid unnecessary updates
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
				...(Array.isArray(userIds) && userIds.length > 0 && { _id: { $in: userIds } }),
			},
			{
				projection: { openBusinessHours: 1 },
			},
		);
	}

	setLivechatStatusActiveBasedOnBusinessHours(userId: IUser['_id']) {
		const query = {
			_id: userId,
			statusDefault: { $ne: UserStatus.OFFLINE },
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		};

		const update = {
			$set: {
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
			},
		};

		return this.updateOne(query, update);
	}

	async isAgentWithinBusinessHours(agentId: IUser['_id']) {
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
		return (await this.countDocuments(query)) > 0;
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
				openBusinessHours: 1 as const,
			},
		};

		return this.updateMany(query, update);
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

	removeRoomsByRoomIdsAndUserId(rids: IRoom['_id'][], userId: IUser['_id']) {
		return this.updateMany(
			{
				_id: userId,
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
				$unset: rids.reduce(
					(acc, rid) => {
						acc[`roomRolePriorities.${rid}`] = '';
						return acc;
					},
					{} as Record<string, ''>,
				),
			},
		);
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id']} roles the list of role ids to remove
	 */
	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]) {
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

	addBannerById(_id: IUser['_id'], banner: { id: string }) {
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
	findOneByAgentUsername(username: string, options?: FindOptions<IUser>) {
		const query = { username, roles: 'livechat-agent' };

		return this.findOne(query, options);
	}

	findOneByExtension(extension: string, options?: FindOptions<IUser>) {
		const query = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions(extensions: string[], options?: FindOptions<IUser>) {
		const query = {
			extension: {
				$in: extensions,
			},
		};

		return this.find(query, options);
	}

	getVoipExtensionByUserId(userId: IUser['_id'], options?: FindOptions<IUser>) {
		const query = {
			_id: userId,
			extension: { $exists: true },
		};
		return this.findOne(query, options);
	}

	setExtension(userId: IUser['_id'], extension: string) {
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

	unsetExtension(userId: IUser['_id']) {
		const query = {
			_id: userId,
		};
		const update = {
			$unset: {
				extension: 1 as const,
			},
		};
		return this.updateOne(query, update);
	}

	getAvailableAgentsIncludingExt<T extends Document = ILivechatAgent>(includeExt?: string, text?: string, options?: FindOptions<IUser>) {
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

	findActiveUsersTOTPEnable(options?: FindOptions<IUser>) {
		const query = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.find(query, options);
	}

	countActiveUsersTOTPEnable(options?: FindOptions<IUser>) {
		const query = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.countDocuments(query, options);
	}

	findActiveUsersEmail2faEnable(options?: FindOptions<IUser>) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}

	countActiveUsersEmail2faEnable(options?: FindOptions<IUser>) {
		const query = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.countDocuments(query, options);
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

	removeRoomByRoomId(rid: IRoom['_id'], options?: UpdateOptions) {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
				$unset: { [`roomRolePriorities.${rid}`]: '' },
			},
			options,
		);
	}

	findOneByResetToken(token: string, options?: FindOptions<IUser>) {
		return this.findOne({ 'services.password.reset.token': token }, options);
	}

	findOneByIdWithEmailAddress(userId: IUser['_id'], options?: FindOptions<IUser>) {
		return this.findOne(
			{
				_id: userId,
				emails: { $exists: true, $ne: [] },
			},
			options,
		);
	}

	setFederationAvatarUrlById(userId: IUser['_id'], federationAvatarUrl: string) {
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

	async findSearchedServerNamesByUserId(userId: IUser['_id']): Promise<string[]> {
		const user = await this.findOne<Pick<IUser, 'federation'>>(
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

	countFederatedExternalUsers() {
		return this.countDocuments({
			federated: true,
		});
	}

	findOnlineUserFromList<T extends Document = ILivechatAgent>(userList: string | string[], isLivechatEnabledWhenAgentIdle?: boolean) {
		// TODO: Create class Agent
		const username = {
			$in: ([] as string[]).concat(userList),
		};

		const query = queryStatusAgentOnline({ username }, isLivechatEnabledWhenAgentIdle);

		return this.find<T>(query);
	}

	countOnlineUserFromList(userList: string | string[], isLivechatEnabledWhenAgentIdle?: boolean) {
		// TODO: Create class Agent
		const username = {
			$in: ([] as string[]).concat(userList),
		};

		const query = queryStatusAgentOnline({ username }, isLivechatEnabledWhenAgentIdle);

		return this.countDocuments(query);
	}

	findOneOnlineAgentByUserList(userList: string | string[], options?: FindOptions<IUser>, isLivechatEnabledWhenAgentIdle?: boolean) {
		// TODO:: Create class Agent
		const username = {
			$in: ([] as string[]).concat(userList),
		};

		const query = queryStatusAgentOnline({ username }, isLivechatEnabledWhenAgentIdle);

		return this.findOne(query, options);
	}

	async getUnavailableAgents(
		_departmentId?: string,
		_extraQuery?: Filter<AvailableAgentsAggregation>,
	): Promise<Pick<AvailableAgentsAggregation, 'username'>[]> {
		return [];
	}

	findBotAgents<T extends Document = ILivechatAgent>(usernameList?: string | string[]): FindCursor<T> {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(usernameList && {
				username: {
					$in: ([] as string[]).concat(usernameList),
				},
			}),
		};

		return this.find<T>(query);
	}

	countBotAgents(usernameList?: string | string[]) {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(usernameList && {
				username: {
					$in: ([] as string[]).concat(usernameList),
				},
			}),
		};

		return this.countDocuments(query);
	}

	removeAllRoomsByUserId(_id: IUser['_id']) {
		return this.updateOne(
			{
				_id,
			},
			{
				$set: { __rooms: [] },
				$unset: { roomRolePriorities: '' },
			},
		);
	}

	removeRoomByUserId(_id: IUser['_id'], rid: IRoom['_id']) {
		return this.updateOne(
			{
				_id,
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
				$unset: { [`roomRolePriorities.${rid}`]: '' },
			},
		);
	}

	addRoomByUserId(_id: IUser['_id'], rid: IRoom['_id']) {
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

	addRoomByUserIds(uids: IUser['_id'][], rid: IRoom['_id']) {
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

	removeRoomByRoomIds(rids: IRoom['_id'][]) {
		return this.updateMany(
			{
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
				$unset: rids.reduce(
					(acc, rid) => {
						acc[`roomRolePriorities.${rid}`] = '';
						return acc;
					},
					{} as Record<string, ''>,
				),
			},
		);
	}

	addRoomRolePriorityByUserId(userId: IUser['_id'], rid: IRoom['_id'], priority: number) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					[`roomRolePriorities.${rid}`]: priority,
				},
			},
		);
	}

	removeRoomRolePriorityByUserId(userId: IUser['_id'], rid: IRoom['_id']) {
		return this.updateOne(
			{
				_id: userId,
			},
			{
				$unset: {
					[`roomRolePriorities.${rid}`]: '',
				},
			},
		);
	}

	async assignRoomRolePrioritiesByUserIdPriorityMap(userIdAndrolePriorityMap: Record<string, number>, rid: IRoom['_id']) {
		const bulk = this.col.initializeUnorderedBulkOp();

		for (const [userId, priority] of Object.entries(userIdAndrolePriorityMap)) {
			bulk.find({ _id: userId }).updateOne({ $set: { [`roomRolePriorities.${rid}`]: priority } });
		}

		if (bulk.length > 0) {
			const result = await bulk.execute();
			return result.modifiedCount;
		}

		return 0;
	}

	unassignRoomRolePrioritiesByRoomId(rid: IRoom['_id']) {
		return this.updateMany(
			{
				__rooms: rid,
			},
			{
				$unset: {
					[`roomRolePriorities.${rid}`]: '',
				},
			},
		);
	}

	getLoginTokensByUserId(userId: IUser['_id']) {
		const query = {
			'services.resume.loginTokens.type': {
				$exists: true,
				$eq: 'personalAccessToken',
			},
			'_id': userId,
		};

		return this.find<ILoginToken>(query, { projection: { 'services.resume.loginTokens': 1 } });
	}

	addPersonalAccessTokenToUser({ userId, loginTokenObject }: { userId: IUser['_id']; loginTokenObject: ILoginToken }) {
		return this.updateOne(
			{ _id: userId },
			{
				$push: {
					'services.resume.loginTokens': loginTokenObject,
				},
			},
		);
	}

	removePersonalAccessTokenOfUser({
		userId,
		loginTokenObject,
	}: {
		userId: IUser['_id'];
		loginTokenObject: AtLeast<IPersonalAccessToken, 'type' | 'name'>;
	}) {
		return this.updateOne(
			{ _id: userId },
			{
				$pull: {
					'services.resume.loginTokens': loginTokenObject,
				},
			},
		);
	}

	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }: { userId: IUser['_id']; tokenName: string }) {
		const query = {
			'services.resume.loginTokens': {
				$elemMatch: { name: tokenName, type: 'personalAccessToken' },
			},
			'_id': userId,
		};

		return this.findOne(query);
	}

	// TODO: check if this is still valid/used for something
	setOperator(_id: IUser['_id'], operator: boolean) {
		// TODO:: Create class Agent
		const update = {
			$set: {
				operator,
			},
		};

		return this.updateOne({ _id }, update);
	}

	async checkOnlineAgents(agentId: IUser['_id'], isLivechatEnabledWhenAgentIdle?: boolean) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId }, isLivechatEnabledWhenAgentIdle);

		return !!(await this.findOne(query));
	}

	findOnlineAgents<T extends Document = ILivechatAgent>(agentId?: IUser['_id'], isLivechatEnabledWhenAgentIdle?: boolean) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId }, isLivechatEnabledWhenAgentIdle);

		return this.find<T>(query);
	}

	countOnlineAgents(agentId: IUser['_id']) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return this.col.countDocuments(query);
	}

	findOneBotAgent<T extends Document = ILivechatAgent>() {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
		};

		return this.findOne<T>(query);
	}

	findOneOnlineAgentById<T extends Document = ILivechatAgent>(
		_id: IUser['_id'],
		isLivechatEnabledWhenAgentIdle?: boolean,
		options?: FindOptions<IUser>,
	) {
		// TODO: Create class Agent
		const query = queryStatusAgentOnline({ _id }, isLivechatEnabledWhenAgentIdle);

		return this.findOne<T>(query, options);
	}

	findAgents<T extends Document = ILivechatAgent>() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.find<T>(query);
	}

	countAgents() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.countDocuments(query);
	}

	// 2
	async getNextAgent(ignoreAgentId?: string, extraQuery?: Filter<AvailableAgentsAggregation>, enabledWhenAgentIdle?: boolean) {
		// TODO: Create class Agent
		// fetch all unavailable agents, and exclude them from the selection
		const unavailableAgents = (await this.getUnavailableAgents(undefined, extraQuery)).map((u) => u.username);
		const extraFilters = {
			...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
			// limit query to remove booked agents
			username: { $nin: unavailableAgents },
		};

		const query = queryStatusAgentOnline(extraFilters, enabledWhenAgentIdle);

		const sort: Record<string, SortDirection> = {
			livechatCount: 1,
			username: 1,
		};

		const update = {
			$inc: {
				livechatCount: 1,
			},
		};

		const user = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (user) {
			return {
				agentId: user._id,
				username: user.username,
			};
		}
		return null;
	}

	async getNextBotAgent(ignoreAgentId?: string) {
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

		const user = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' } as FindOneAndUpdateOptions);
		if (user) {
			return {
				agentId: user._id,
				username: user.username,
			};
		}
		return null;
	}

	setLivechatStatus(userId: IUser['_id'], status: ILivechatAgentStatus) {
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

	makeAgentUnavailableAndUnsetExtension(userId: IUser['_id']) {
		const query = {
			_id: userId,
			roles: 'livechat-agent',
		};

		const update = {
			$set: {
				statusLivechat: ILivechatAgentStatus.NOT_AVAILABLE,
			},
			$unset: {
				extension: 1 as const,
			},
		};

		return this.updateOne(query, update);
	}

	// TODO: improve type of livechatData
	setLivechatData(userId: IUser['_id'], data: Record<string, unknown> = {}) {
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

	// TODO: why this needs to be one by one instead of an updateMany?
	async closeOffice() {
		// TODO: Create class Agent
		const promises: Promise<UpdateResult<Document>>[] = [];
		// TODO: limit the data returned by findAgents
		await this.findAgents().forEach((agent) => {
			promises.push(this.setLivechatStatus(agent._id, ILivechatAgentStatus.NOT_AVAILABLE));
		});
		await Promise.all(promises);
	}

	// Same todo's as the above
	async openOffice() {
		// TODO: Create class Agent
		const promises: Promise<UpdateResult<Document>>[] = [];
		await this.findAgents().forEach((agent) => {
			promises.push(this.setLivechatStatus(agent._id, ILivechatAgentStatus.AVAILABLE));
		});
		await Promise.all(promises);
	}

	getAgentInfo(
		agentId: IUser['_id'],
		showAgentEmail = false,
	): Promise<Pick<ILivechatAgent, '_id' | 'name' | 'username' | 'phone' | 'customFields' | 'status' | 'livechat' | 'emails'> | null> {
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

	roleBaseQuery(userId: IUser['_id']) {
		return { _id: userId };
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	setE2EPublicAndPrivateKeysByUserId(userId: IUser['_id'], { public_key, private_key }: { public_key: string; private_key: string }) {
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

	async rocketMailUnsubscribe(_id: IUser['_id'], createdAt: string) {
		const query = {
			_id,
			createdAt: new Date(parseInt(createdAt)),
		};
		const update = {
			$set: {
				'mailer.unsubscribed': true,
			},
		};
		const affectedRows = (await this.updateOne(query, update)).modifiedCount;
		return affectedRows;
	}

	async fetchKeysByUserId(userId: IUser['_id']) {
		const user = await this.findOne({ _id: userId }, { projection: { e2e: 1 } });

		if (!user?.e2e?.public_key) {
			return {};
		}

		return {
			public_key: user.e2e.public_key,
			private_key: user.e2e.private_key,
		};
	}

	disable2FAAndSetTempSecretByUserId(userId: IUser['_id'], tempToken: string) {
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

	enable2FAAndSetSecretAndCodesByUserId(userId: IUser['_id'], secret: string, backupCodes: string[]) {
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

	disable2FAByUserId(userId: IUser['_id']) {
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

	update2FABackupCodesByUserId(userId: IUser['_id'], backupCodes: string[]) {
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

	enableEmail2FAByUserId(userId: IUser['_id']) {
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

	disableEmail2FAByUserId(userId: IUser['_id']) {
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

	findByIdsWithPublicE2EKey(ids: IUser['_id'][], options?: FindOptions<IUser>) {
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

	resetE2EKey(userId: IUser['_id']) {
		return this.updateOne(
			{ _id: userId },
			{
				$unset: {
					e2e: '',
				},
			},
		);
	}

	removeExpiredEmailCodeOfUserId(userId: IUser['_id']) {
		return this.updateOne(
			{ '_id': userId, 'services.emailCode.expire': { $lt: new Date() } },
			{
				$unset: { 'services.emailCode': 1 },
			},
		);
	}

	removeEmailCodeOfUserId(userId: IUser['_id']) {
		return this.updateOne(
			{ _id: userId },
			{
				$unset: { 'services.emailCode': 1 },
			},
		);
	}

	incrementInvalidEmailCodeAttempt(userId: IUser['_id']) {
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

	async maxInvalidEmailCodeAttemptsReached(userId: IUser['_id'], maxAttempts: number) {
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

	addEmailCodeByUserId(userId: IUser['_id'], code: string, expire: Date) {
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
	findActiveUsersInRoles(roles: IRole['_id'][], options?: FindOptions<IUser>) {
		roles = ([] as string[]).concat(roles);

		const query = {
			roles: { $in: roles },
			active: true,
		};

		return this.find(query, options);
	}

	countActiveUsersInRoles(roles: IRole['_id'][], options?: FindOptions<IUser>) {
		roles = ([] as string[]).concat(roles);

		const query = {
			roles: { $in: roles },
			active: true,
		};

		return this.countDocuments(query, options);
	}

	findOneByUsernameAndServiceNameIgnoringCase(
		username: string | RegExp,
		userId: IUser['_id'],
		serviceName: string,
		options?: FindOptions<IUser>,
	) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username, [`services.${serviceName}.id`]: userId };

		return this.findOne(query, options);
	}

	findOneByEmailAddressAndServiceNameIgnoringCase(
		emailAddress: string,
		userId: IUser['_id'],
		serviceName: string,
		options?: FindOptions<IUser>,
	) {
		const query = {
			'emails.address': String(emailAddress).trim(),
			[`services.${serviceName}.id`]: userId,
		};

		return this.findOne(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneByEmailAddress(emailAddress: string, options?: FindOptions<IUser>) {
		const query = { 'emails.address': String(emailAddress).trim() };

		return this.findOne(query, {
			collation: { locale: 'en', strength: 2 }, // Case insensitive
			...options,
		});
	}

	findOneWithoutLDAPByEmailAddress(emailAddress: string, options?: FindOptions<IUser>) {
		const query = {
			'email.address': emailAddress.trim().toLowerCase(),
			'services.ldap': {
				$exists: false,
			},
		};

		return this.findOne(query, options);
	}

	findOneAdmin(userId: IUser['_id'], options?: FindOptions<IUser>) {
		const query = { roles: { $in: ['admin'] }, _id: userId };

		return this.findOne(query, options);
	}

	findOneByIdAndLoginToken(_id: IUser['_id'], token: string, options?: FindOptions<IUser>) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findOneById(userId: IUser['_id'], options: FindOptions<IUser> = {}) {
		const query = { _id: userId };

		return this.findOne(query, options);
	}

	findOneActiveById(userId?: IUser['_id'], options?: FindOptions<IUser>) {
		const query = {
			_id: userId,
			active: true,
		};

		return this.findOne(query, options);
	}

	findOneByIdOrUsername(idOrUsername: IUser['_id'] | IUser['username'], options?: FindOptions<IUser>) {
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

	findOneByRolesAndType<T extends Document = IUser>(roles: IRole['_id'][], type: string, options?: FindOptions<IUser>) {
		const query = { roles, type };

		return this.findOne<T>(query, options);
	}

	findNotOfflineByIds(users?: IUser['_id'][], options?: FindOptions<IUser>) {
		const query = {
			_id: { $in: users },
			status: {
				$in: [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY],
			},
		};
		return this.find(query, options);
	}

	findUsersNotOffline(options?: FindOptions<IUser>) {
		const query = {
			username: {
				$exists: true,
			},
			status: {
				$in: [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY],
			},
		};

		return this.find(query, options);
	}

	countUsersNotOffline(options?: FindOptions<IUser>) {
		const query = {
			username: {
				$exists: true,
			},
			status: {
				$in: [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY],
			},
		};

		return this.col.countDocuments(query, options);
	}

	findNotIdUpdatedFrom(uid: IUser['_id'], from: Date, options?: FindOptions<IUser>) {
		const query: Filter<IUser> = {
			_id: { $ne: uid },
			username: {
				$exists: true,
			},
			_updatedAt: { $gte: from },
		};

		return this.find(query, options);
	}

	async findByRoomId(rid: IRoom['_id'], options?: FindOptions<IUser>) {
		const data = (await Subscriptions.findByRoomId(rid).toArray()).map((item) => item.u._id);
		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findByUsername(username: string, options?: FindOptions<IUser>) {
		const query = { username };

		return this.find(query, options);
	}

	findByUsernames(usernames: string[], options?: FindOptions<IUser>) {
		const query = { username: { $in: usernames } };

		return this.find(query, options);
	}

	findByUsernamesIgnoringCase(usernames: string[], options?: FindOptions<IUser>) {
		const query = {
			username: {
				$in: usernames.filter(Boolean).map((u) => new RegExp(`^${escapeRegExp(u)}$`, 'i')),
			},
		};

		return this.find(query, options);
	}

	findActiveByUserIds(ids: IUser['_id'][], options: FindOptions<IUser> = {}) {
		return this.find(
			{
				active: true,
				type: { $nin: ['app'] },
				_id: { $in: ids },
			},
			options,
		);
	}

	findActiveLocalGuests(idExceptions: IUser['_id'] | IUser['_id'][] = [], options: FindOptions<IUser> = {}) {
		const query: Filter<IUser> = {
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

	countActiveLocalGuests(idExceptions: IUser['_id'] | IUser['_id'][] = []) {
		const query: Filter<IUser> = {
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

		return this.countDocuments(query);
	}

	// 4
	findUsersByNameOrUsername(nameOrUsername: string, options?: FindOptions<IUser>) {
		const query = {
			username: {
				$exists: true,
			},

			$or: [{ name: nameOrUsername }, { username: nameOrUsername }],

			type: {
				$in: ['user'],
			},
		};

		return this.find(query, options);
	}

	findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress: string, options?: FindOptions<IUser>) {
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

	findCrowdUsers(options?: FindOptions<IUser>) {
		const query = { crowd: true };

		return this.find(query, options);
	}

	async getLastLogin(options: FindOptions<IUser> = { projection: { _id: 0, lastLogin: 1 } }) {
		options.sort = { lastLogin: -1 };
		const user = await this.findOne({}, options);
		return user?.lastLogin;
	}

	findUsersByUsernames<T extends Document = IUser>(usernames: string[], options?: FindOptions<IUser>) {
		const query = {
			username: {
				$in: usernames,
			},
		};

		return this.find<T>(query, options);
	}

	findUsersByIds(ids: IUser['_id'][], options?: FindOptions<IUser>) {
		const query = {
			_id: {
				$in: ids,
			},
		};
		return this.find(query, options);
	}

	findUsersWithUsernameByIds(ids: IUser['_id'][], options?: FindOptions<IUser>) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: true,
			},
		};

		return this.find(query, options);
	}

	findUsersWithUsernameByIdsNotOffline(ids: IUser['_id'][], options?: FindOptions<IUser>) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: true,
			},
			status: {
				$in: [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY],
			},
		};

		return this.find(query, options);
	}

	/**
	 * @param {import('mongodb').Filter<import('@rocket.chat/core-typings').IStats>} projection
	 */
	getOldest(optionsParams?: FindOptions<IUser>) {
		const query = {
			_id: {
				$ne: 'rocket.cat',
			},
		};

		const options: FindOptions<IUser> = {
			...optionsParams,
			sort: {
				createdAt: 1,
			},
		};

		return this.findOne(query, options);
	}

	countRemote(options: FindOptions<IUser> = {}) {
		return this.countDocuments({ isRemote: true }, options);
	}

	findActiveRemote(options: FindOptions<IUser> = {}) {
		return this.find(
			{
				active: true,
				isRemote: true,
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	findActiveFederated(options: FindOptions<IUser> = {}) {
		return this.find(
			{
				active: true,
				federated: true,
			},
			options,
		);
	}

	getSAMLByIdAndSAMLProvider(_id: IUser['_id'], provider: string) {
		return this.findOne(
			{
				_id,
				'services.saml.provider': provider,
			},
			{
				projection: { 'services.saml': 1 },
			},
		);
	}

	findBySAMLNameIdOrIdpSession(nameID: string, idpSession: string, options?: FindOptions<IUser>) {
		return this.find(
			{
				$or: [{ 'services.saml.nameID': nameID }, { 'services.saml.idpSession': idpSession }],
			},
			options,
		);
	}

	countBySAMLNameIdOrIdpSession(nameID: string, idpSession: string) {
		return this.countDocuments({
			$or: [{ 'services.saml.nameID': nameID }, { 'services.saml.idpSession': idpSession }],
		});
	}

	findBySAMLInResponseTo(inResponseTo: string, options?: FindOptions<IUser>) {
		return this.find(
			{
				'services.saml.inResponseTo': inResponseTo,
			},
			options,
		);
	}

	findOneByFreeSwitchExtension<T extends Document = IUser>(freeSwitchExtension: string, options: FindOptions<IUser> = {}) {
		return this.findOne<T>(
			{
				freeSwitchExtension,
			},
			options,
		);
	}

	findOneByFreeSwitchExtensions<T extends Document = IUser>(freeSwitchExtensions: string[], options: FindOptions<IUser> = {}) {
		return this.findOne<T>(
			{
				freeSwitchExtension: { $in: freeSwitchExtensions },
			},
			options,
		);
	}

	findAssignedFreeSwitchExtensions() {
		return this.findUsersWithAssignedFreeSwitchExtensions({
			projection: {
				freeSwitchExtension: 1,
			},
		}).map(({ freeSwitchExtension }) => freeSwitchExtension);
	}

	findUsersWithAssignedFreeSwitchExtensions<T extends Document = IUser>(options: FindOptions<IUser> = {}) {
		return this.find<T>(
			{
				freeSwitchExtension: {
					$exists: true,
				},
			},
			options,
		);
	}

	// UPDATE
	addImportIds(_id: IUser['_id'], importIds: string[]) {
		importIds = ([] as string[]).concat(importIds);

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

	updateInviteToken(_id: IUser['_id'], inviteToken: string) {
		const update = {
			$set: {
				inviteToken,
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateLastLoginById(_id: IUser['_id']) {
		const update = {
			$set: {
				lastLogin: new Date(),
			},
		};

		return this.updateOne({ _id }, update);
	}

	addPasswordToHistory(_id: IUser['_id'], password: string, passwordHistoryAmount: number) {
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

	setServiceId(_id: IUser['_id'], serviceName: string, serviceId: string) {
		const update: UpdateFilter<IUser> = { $set: {} };

		const serviceIdKey = `services.${serviceName}.id`;
		if (update.$set) {
			update.$set[serviceIdKey] = serviceId;
		}

		return this.updateOne({ _id }, update);
	}

	setUsername(_id: IUser['_id'], username: string, options?: UpdateOptions) {
		const update = { $set: { username } };

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	setEmail(_id: IUser['_id'], email: string, verified = false, options?: UpdateOptions) {
		const update = {
			$set: {
				emails: [
					{
						address: email,
						verified,
					},
				],
			},
		};

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	// 5
	setEmailVerified(_id: IUser['_id'], email: string) {
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

	setName(_id: IUser['_id'], name: string, options?: UpdateOptions) {
		const update = {
			$set: {
				name,
			},
		};

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	unsetName(_id: IUser['_id'], options?: UpdateOptions) {
		const update = {
			$unset: {
				name: 1 as const,
			},
		};

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	setCustomFields(_id: IUser['_id'], fields: Record<string, string>) {
		const values: Record<string, string> = {};
		Object.keys(fields).forEach((key) => {
			values[`customFields.${key}`] = fields[key];
		});

		const update = { $set: values };

		return this.updateOne({ _id }, update);
	}

	setAvatarData(_id: IUser['_id'], origin: string, etag: string, options?: UpdateOptions) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.updateOne({ _id }, update, { session: options?.session });
	}

	unsetAvatarData(_id: IUser['_id']) {
		const update: UpdateFilter<IUser> = {
			$unset: {
				avatarOrigin: 1,
				avatarETag: 1,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setUserActive(_id: IUser['_id'], active: boolean | null) {
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

	setAllUsersActive(active: boolean) {
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
	setActiveNotLoggedInAfterWithRole(latestLastLoginDate: Date, role: IRole['_id'] = 'user', active = false) {
		const neverActive = { lastLogin: { $exists: false }, createdAt: { $lte: latestLastLoginDate } };
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

	unsetRequirePasswordChange(_id: IUser['_id']) {
		const update: UpdateFilter<IUser> = {
			$unset: {
				requirePasswordChange: true,
				requirePasswordChangeReason: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	resetPasswordAndSetRequirePasswordChange(_id: IUser['_id'], requirePasswordChange: boolean, requirePasswordChangeReason: string) {
		const update = {
			$unset: {
				'services.password': 1 as const,
			},
			$set: {
				requirePasswordChange,
				requirePasswordChangeReason,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setLanguage(_id: IUser['_id'], language: string) {
		const update = {
			$set: {
				language,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setProfile(_id: IUser['_id'], profile: Record<string, unknown>) {
		const update = {
			$set: {
				'settings.profile': profile,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setBio(_id: IUser['_id'], bio = '') {
		const update: UpdateFilter<IUser> = {
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

	setNickname(_id: IUser['_id'], nickname = '') {
		const update: UpdateFilter<IUser> = {
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

	clearSettings(_id: IUser['_id']) {
		const update = {
			$set: {
				settings: {},
			},
		};

		return this.updateOne({ _id }, update);
	}

	setPreferences(_id: IUser['_id'], preferences: Record<string, string>) {
		const settingsObject = Object.assign(
			{},
			...Object.keys(preferences).map((key) => ({
				...(preferences[key] !== undefined && { [`settings.preferences.${key}`]: preferences[key] }),
			})),
		);

		const update: DeepWritable<UpdateFilter<IUser>> = {
			$set: settingsObject,
		};
		if (parseInt(preferences.clockMode) === 0) {
			delete update.$set?.['settings.preferences.clockMode'];
			update.$unset = { 'settings.preferences.clockMode': 1 };
		}

		return this.updateOne({ _id }, update);
	}

	setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(_id: IUser['_id'], token: string, hash: string, until: Date) {
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

	setUtcOffset(_id: IUser['_id'], utcOffset: number) {
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

	setReason(_id: IUser['_id'], reason: string) {
		const update = {
			$set: {
				reason,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetReason(_id: IUser['_id']) {
		const update = {
			$unset: {
				reason: true as const,
			},
		};

		return this.updateOne({ _id }, update);
	}

	async bannerExistsById(_id: IUser['_id'], bannerId: string) {
		const query = {
			_id,
			[`banners.${bannerId}`]: {
				$exists: true,
			},
		};

		return (await this.countDocuments(query)) !== 0;
	}

	setBannerReadById(_id: IUser['_id'], bannerId: string) {
		const update = {
			$set: {
				[`banners.${bannerId}.read`]: true,
			},
		};

		return this.updateOne({ _id }, update);
	}

	removeBannerById(_id: IUser['_id'], bannerId: string) {
		const update = {
			$unset: {
				[`banners.${bannerId}`]: true as const,
			},
		};

		return this.updateOne({ _id }, update);
	}

	removeSamlServiceSession(_id: IUser['_id']) {
		const update = {
			$unset: {
				'services.saml.idpSession': 1 as const,
			},
		};

		return this.updateOne({ _id }, update);
	}

	updateDefaultStatus(_id: IUser['_id'], statusDefault: UserStatus) {
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

	setSamlInResponseTo(_id: IUser['_id'], inResponseTo: string) {
		return this.updateOne(
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

	async setFreeSwitchExtension(_id: IUser['_id'], extension?: string) {
		return this.updateOne(
			{
				_id,
			},
			{
				...(extension ? { $set: { freeSwitchExtension: extension } } : { $unset: { freeSwitchExtension: 1 } }),
			},
		);
	}

	// INSERT
	create(data: InsertionModel<IUser>) {
		const user = {
			createdAt: new Date(),
			avatarOrigin: 'none',
		} as InsertionModel<IUser>;

		Object.assign(user, data);

		return this.insertOne(user);
	}

	// REMOVE
	removeById(_id: IUser['_id']) {
		return this.deleteOne({ _id });
	}

	removeLivechatData(userId: IUser['_id']) {
		const query = {
			_id: userId,
		};

		const update = {
			$unset: {
				livechat: 1 as const,
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
	getUsersToSendOfflineEmail(usersIds: IUser['_id'][]) {
		const query = {
			'_id': {
				$in: usersIds,
			},
			'active': true,
			'status': UserStatus.OFFLINE,
			'statusConnection': {
				$ne: UserStatus.ONLINE,
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

	countActiveUsersByService(serviceName: string, options?: FindOptions<IUser>) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: { $ne: ['guest'] },
			[`services.${serviceName}`]: { $exists: true },
		};

		return this.countDocuments(query, options);
	}

	// here
	async getActiveLocalUserCount() {
		return Promise.all([
			// Count all active users (fast based on index)
			this.countDocuments({
				active: true,
			}),
			// Count all active that are guests, apps, bots or federated
			// Fast based on indexes, usually based on guest index as is usually small
			this.countDocuments({
				active: true,
				$or: [{ roles: ['guest'] }, { type: { $in: ['app', 'bot'] } }, { federated: true }, { isRemote: true }],
			}),
			// Get all active and remove the guests, apps, bots and federated
		]).then((results) => results.reduce((a, b) => a - b));
	}

	getActiveLocalGuestCount(idExceptions = []) {
		return this.countActiveLocalGuests(idExceptions);
	}

	removeOlderResumeTokensByUserId(userId: IUser['_id'], fromDate: Date) {
		return this.updateOne(
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

	countAllUsersWithPendingAvatar() {
		const query = {
			_pendingAvatarUrl: {
				$exists: true,
			},
		};

		return this.countDocuments(query);
	}

	updateCustomFieldsById(userId: IUser['_id'], customFields: Record<string, unknown>) {
		return this.updateOne(
			{ _id: userId },
			{
				$set: {
					customFields,
				},
			},
		);
	}

	countRoomMembers(roomId: IRoom['_id']) {
		return this.countDocuments({ __rooms: roomId, active: true });
	}

	removeAgent(_id: IUser['_id']) {
		const update: UpdateFilter<IUser> = {
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

	countByRole(role: IRole['_id']) {
		return this.countDocuments({ roles: role });
	}

	updateLivechatStatusByAgentIds(userIds: IUser['_id'][], status: ILivechatAgentStatus) {
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
