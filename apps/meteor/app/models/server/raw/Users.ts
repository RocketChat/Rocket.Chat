import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';
import type { IBanner, ILivechatAgent, ILivechatBusinessHour, ILivechatDepartment, IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection, Cursor, FilterQuery, FindOneOptions, UpdateQuery, UpdateWriteOpResult, WithoutProjection } from 'mongodb';
import { ILivechatAgentStatus, UserStatus } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';

type RoleIds = IRole['_id'][] | IRole['_id'];

export class UsersRaw extends BaseRaw<IUser> {
	constructor(...args: [col: Collection<IUser>, trash: Collection<IUser>, options: { preventSetUpdatedAt?: boolean }]) {
		super(...args);

		// FIXME: check ResultFields type
		// FIXME: check BaseRaw 2nd generic param
		// @ts-ignore
		this.defaultFields = {
			__rooms: 0,
		};
	}

	/**
	 * @param {string} uid
	 * @param {IRole['_id'][]} roleIds list of role ids
	 */
	async addRolesByUserId(uid: IUser['_id'], roleIds: RoleIds): Promise<UpdateWriteOpResult> {
		if (!Array.isArray(roleIds)) {
			roleIds = [roleIds];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] Users.addRolesByUserId: roles should be an array');
		}

		const query: FilterQuery<IUser> = {
			_id: uid,
		};

		const update: UpdateQuery<IUser> = {
			$addToSet: {
				roles: { $each: roleIds },
			},
		};
		return this.updateOne(query, update);
	}

	/**
	 * @param {IRole['_id'][]} roleIds list of role ids
	 * @param {null} _scope the value for the role scope (room id) - not used in the users collection
	 * @param {any} options
	 */
	findUsersInRoles(roleIds: RoleIds, _scope: null, options: WithoutProjection<FindOneOptions<IUser>>) {
		roleIds = Array.isArray(roleIds) ? roleIds : [roleIds];

		const query: FilterQuery<IUser> = {
			roles: { $in: roleIds },
		};

		return this.find(query, options);
	}

	findOneByUsername(username: IUser['username'], options: FindOneOptions<IUser>): Promise<IUser | null> {
		const query: FilterQuery<IUser> = { username };

		return this.findOne(query, options);
	}

	findOneAgentById(_id: ILivechatAgent['_id'], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query: FilterQuery<ILivechatAgent> = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne(query, options);
	}

	/**
	 * @param {IRole['_id'][] | IRole['_id']} roleIds the list of role ids
	 * @param {any} query
	 * @param {any} options
	 */
	findUsersInRolesWithQuery(roleIds: RoleIds, query: FilterQuery<IUser>, options: WithoutProjection<FindOneOptions<IUser>>) {
		roleIds = Array.isArray(roleIds) ? roleIds : [roleIds];

		Object.assign(query, { roles: { $in: roleIds } });

		return this.find(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase(
		username: IUser['username'] | RegExp,
		rid: IRoom['_id'],
		options: WithoutProjection<FindOneOptions<IUser>>,
	) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query: FilterQuery<IUser> = {
			__rooms: rid,
			username,
		};

		return this.findOne(query, options);
	}

	findOneByIdAndLoginHashedToken(_id: IUser['_id'], token: string, options: WithoutProjection<FindOneOptions<IUser>>) {
		const query: FilterQuery<IUser> = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findByActiveUsersExcept(
		searchTerm: string,
		exceptions: IUser['username'][] | IUser['username'] = [],
		options: WithoutProjection<FindOneOptions<IUser>> = {},
		// FIXME: v
		searchFields: any,
		extraQuery: any[] = [],
		{ startsWith = false, endsWith = false } = {},
	) {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		// if the search term is empty, don't need to have the $or statement (because it would be an empty regex)
		if (searchTerm === '') {
			const query: FilterQuery<IUser> = {
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

		const orStmt = (searchFields || []).reduce(function (acc: any, el: any) {
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

	findActiveByIds(userIds: IUser['_id'][], options: WithoutProjection<FindOneOptions<IUser>> = {}) {
		const query = {
			_id: { $in: userIds },
			active: true,
		};

		return this.find(query, options);
	}

	findByIds(userIds: IUser['_id'][], options: WithoutProjection<FindOneOptions<IUser>> = {}) {
		const query = {
			_id: { $in: userIds },
		};

		return this.find(query, options);
	}

	findOneByUsernameIgnoringCase(username: IUser['username'] | RegExp, options: WithoutProjection<FindOneOptions<IUser>> = {}) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	async findOneByLDAPId(id: string, attribute: any = undefined) {
		const query: FilterQuery<IUser> = {
			'services.ldap.id': id,
		};

		if (attribute) {
			query['services.ldap.idAttribute'] = attribute;
		}

		return this.findOne(query);
	}

	findLDAPUsers(options: WithoutProjection<FindOneOptions<IUser>>) {
		const query = { ldap: true };

		return this.find(query, options);
	}

	findConnectedLDAPUsers(options: WithoutProjection<FindOneOptions<IUser>>) {
		const query = {
			'ldap': true,
			'services.resume.loginTokens': {
				$exists: true,
				$ne: [],
			},
		};

		return this.find(query, options);
	}

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']) {
		const query = {
			_id: userId,
			roles: roleId,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	getDistinctFederationDomains() {
		return this.col.distinct('federation.origin', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department: ILivechatDepartment['_id'], ignoreAgentId: ILivechatAgent['_id']) {
		const aggregate: any = [
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

		const agent = await this.col
			.aggregate<{
				agentId: ILivechatAgent['_id'];
				username: ILivechatAgent['username'];
				lastRoutingTime: ILivechatAgent['lastRoutingTime'];
				departments: ILivechatDepartment['_id'][];
				count: number;
			}>(aggregate)
			.next();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getLastAvailableAgentRouted(department: ILivechatDepartment['_id'], ignoreAgentId: ILivechatAgent['_id']) {
		const aggregate: any = [
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

		const agent = await this.col
			.aggregate<{
				agentId: ILivechatAgent['_id'];
				username: ILivechatAgent['username'];
				lastRoutingTime: ILivechatAgent['lastRoutingTime'];
				departments: ILivechatDepartment['_id'][];
			}>(aggregate)
			.next();
		if (agent) {
			await this.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async setLastRoutingTime(agentId: ILivechatAgent['_id']) {
		// FIXME
		const result = await this.col.findOneAndUpdate(
			{ _id: agentId },
			{
				$set: {
					lastRoutingTime: new Date(),
				},
			},
		);
		return result.value;
	}

	setLivechatStatusIf(agentId: ILivechatAgent['_id'], status: ILivechatAgentStatus, conditions: any = {}, extraFields: any = {}) {
		// TODO: Create class Agent
		const query = {
			_id: agentId,
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

	async getAgentAndAmountOngoingChats(agentId: ILivechatAgent['_id']) {
		const aggregate: any = [
			{
				$match: {
					_id: agentId,
					status: { $exists: true, $ne: 'offline' },
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

		return this.col.aggregate(aggregate).next();
	}

	findAllResumeTokensByUserId(userId: IUser['_id']) {
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

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(
		termRegex: RegExp,
		exceptions: string[] | string = [],
		conditions: string[] = [],
		options: WithoutProjection<FindOneOptions<IUser>> = {},
	) {
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

	countAllAgentsStatus({ departmentId = undefined }: { departmentId?: ILivechatDepartment['_id'] }) {
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
		const params: Exclude<Parameters<Collection<IUser>['aggregate']>[0], undefined> = [match];
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col.aggregate(params).toArray();
	}

	getTotalOfRegisteredUsersByDate({ start, end, options = {} }: { start: Date; end: Date; options: PaginatedRequest }) {
		const params: Exclude<Parameters<Collection<IUser>['aggregate']>[0], undefined> = [
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

	updateStatusText(_id: IUser['_id'], statusText: string) {
		const update = {
			$set: {
				statusText,
			},
		};

		return this.update({ _id }, update);
	}

	updateStatusByAppId(appId: string, status: UserStatus) {
		// FIXME: add IApp to core-typing maybe?
		const query: any = {
			appId,
			status: { $ne: status },
		};

		const update: UpdateQuery<IUser> = {
			$set: {
				status,
			},
		};

		return this.update(query, update, { multi: true });
	}

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: ILivechatBusinessHour['_id'][]) {
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

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: ILivechatBusinessHour['_id'][], agentId: ILivechatAgent['_id']) {
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

	addBusinessHourByAgentIds(agentIds: ILivechatAgent['_id'][] = [], businessHourId: ILivechatBusinessHour['_id']) {
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

	removeBusinessHourByAgentIds(agentIds: ILivechatAgent['_id'][] = [], businessHourId: ILivechatBusinessHour['_id']) {
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

	openBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][] = [],
		businessHourId: ILivechatBusinessHour['_id'],
	) {
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

	closeBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][] = [],
		businessHourId: ILivechatBusinessHour['_id'],
	) {
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

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: ILivechatBusinessHour['_id'][]) {
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

	updateLivechatStatusBasedOnBusinessHours(agentIds: ILivechatAgent['_id'][] = []) {
		const query = {
			$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
			roles: 'livechat-agent',
			...(Array.isArray(agentIds) && agentIds.length > 0 && { _id: { $in: agentIds } }),
		};

		const update = {
			$set: {
				statusLivechat: 'not-available',
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLivechatStatusActiveBasedOnBusinessHours(agentId: ILivechatAgent['_id']) {
		const query = {
			_id: agentId,
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

	async isAgentWithinBusinessHours(agentId: ILivechatAgent['_id']) {
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

		const update: UpdateQuery<ILivechatAgent> = {
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
			fields: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}

	addBannerById(_id: string, banner: IBanner) {
		const query = {
			_id,
			[`banners.${banner._id}.read`]: {
				$ne: true,
			},
		};

		const update = {
			$set: {
				[`banners.${banner._id}`]: banner,
			},
		};

		return this.updateOne(query, update);
	}

	// Voip functions
	findOneByAgentUsername(username: ILivechatAgent['username'], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query = { username, roles: 'livechat-agent' };

		return this.findOne(query, options);
	}

	findOneByExtension(extension: string, options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions(extensions: string[], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query = {
			extension: {
				$in: extensions,
			},
		};

		return this.find(query, options);
	}

	getVoipExtensionByUserId(agentId: ILivechatAgent['_id'], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query = {
			_id: agentId,
			extension: { $exists: true },
		};
		return this.findOne(query, options);
	}

	setExtension(agentId: ILivechatAgent['_id'], extension: string) {
		const query = {
			_id: agentId,
		};

		const update: UpdateQuery<IUser> = {
			$set: {
				extension,
			},
		};
		return this.update(query, update);
	}

	unsetExtension(agentId: ILivechatAgent['_id']) {
		const query: FilterQuery<ILivechatAgent> = {
			_id: agentId,
		};
		const update: UpdateQuery<ILivechatAgent> = {
			$unset: {
				extension: true,
			},
		};
		return this.update(query, update);
	}

	getAvailableAgentsIncludingExt(includeExt: string, text: string, options: WithoutProjection<FindOneOptions<IUser>>): Cursor<any> {
		const query: FilterQuery<ILivechatAgent> = {
			roles: { $in: ['livechat-agent'] },
			$and: [
				...(text && text.trim()
					? [{ $or: [{ username: new RegExp(escapeRegExp(text), 'i') }, { name: new RegExp(escapeRegExp(text), 'i') }] }]
					: []),
				{ $or: [{ extension: { $exists: false } }, ...(includeExt ? [{ extension: includeExt }] : [])] },
			],
		};

		return this.find(query, options);
	}

	findActiveUsersTOTPEnable(options: WithoutProjection<FindOneOptions<IUser>>): Cursor<IUser> {
		const query: FilterQuery<IUser> = {
			'active': true,
			'services.totp.enabled': true,
		};
		return this.find(query, options);
	}

	findActiveUsersEmail2faEnable(options: WithoutProjection<FindOneOptions<IUser>>): Cursor<IUser> {
		const query: FilterQuery<IUser> = {
			'active': true,
			'services.email2fa.enabled': true,
		};
		return this.find(query, options);
	}
}
