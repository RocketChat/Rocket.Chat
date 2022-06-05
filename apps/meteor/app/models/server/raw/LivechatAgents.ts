import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { ILivechatAgent, ILivechatBusinessHour, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Collection, FilterQuery, FindOneOptions, UpdateQuery, WithoutProjection } from 'mongodb';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class LivechatAgentsRaw extends BaseRaw<ILivechatAgent> {
	constructor(col: Collection<ILivechatAgent>, trash?: Collection<ILivechatAgent>, options?: { preventSetUpdatedAt: boolean }) {
		super(col, trash, options);
	}

	findOneAgentById(
		agentId: ILivechatAgent['_id'],
		options: WithoutProjection<FindOneOptions<ILivechatAgent>>,
	): Promise<ILivechatAgent | null> {
		const query: FilterQuery<ILivechatAgent> = {
			agentId,
			roles: 'livechat-agent',
		};

		return this.findOne(query, options);
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

	async setLastRoutingTime(userId: ILivechatAgent['_id']) {
		// FIXME
		const result = await this.col.findOneAndUpdate(
			{ _id: userId },
			{
				$set: {
					lastRoutingTime: new Date(),
				},
			},
		);
		return result.value;
	}

	setLivechatStatusIf(userId: ILivechatAgent['_id'], status: ILivechatAgentStatus, conditions: any = {}, extraFields = {}) {
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

	async getAgentAndAmountOngoingChats(userId: ILivechatAgent['_id']) {
		const aggregate: any = [
			{
				$match: {
					_id: userId,
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

		const agent = await this.col.aggregate(aggregate).next();
		return agent;
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
		const params: Exclude<Parameters<Collection<ILivechatAgent>['aggregate']>[0], undefined> = [match];
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		return this.col.aggregate(params).toArray();
	}

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: ILivechatBusinessHour['_id'][]) {
		const query: FilterQuery<ILivechatAgent> = {
			roles: 'livechat-agent',
		};

		const update: UpdateQuery<ILivechatAgent> = {
			$set: {
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
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
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
			},
			$addToSet: {
				openBusinessHours: { $each: businessHourIds },
			},
		};

		return this.update(query, update, { multi: true });
	}

	addBusinessHourByAgentIds(agentIds: Array<ILivechatAgent['_id']> = [], businessHourId: ILivechatBusinessHour['_id']) {
		const query = {
			_id: { $in: agentIds },
			roles: 'livechat-agent',
		};

		const update = {
			$set: {
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	removeBusinessHourByAgentIds(agentIds: Array<ILivechatAgent['_id']> = [], businessHourId: ILivechatBusinessHour['_id']) {
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
		agentIdsWithDepartment: Array<ILivechatAgent['_id']> = [],
		businessHourId: ILivechatBusinessHour['_id'],
	) {
		const query = {
			_id: { $nin: agentIdsWithDepartment },
		};

		const update = {
			$set: {
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
			},
			$addToSet: {
				openBusinessHours: businessHourId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	closeBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: Array<ILivechatAgent['_id']> = [],
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

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: Array<ILivechatBusinessHour['_id']>) {
		const query: FilterQuery<ILivechatAgent> = {
			roles: 'livechat-agent',
		};

		const update: UpdateQuery<ILivechatAgent> = {
			$pull: {
				openBusinessHours: { $in: businessHourIds },
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateLivechatStatusBasedOnBusinessHours(agentIds: ILivechatAgent['_id'][] = []) {
		const query: FilterQuery<ILivechatAgent> = {
			$or: [{ openBusinessHours: { $exists: false } }, { openBusinessHours: { $size: 0 } }],
			roles: 'livechat-agent',
			...(Array.isArray(agentIds) && agentIds.length > 0 && { _id: { $in: agentIds } }),
		};

		const update: UpdateQuery<ILivechatAgent> = {
			$set: {
				statusLivechat: ILivechatAgentStatus.UNAVAILABLE,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLivechatStatusActiveBasedOnBusinessHours(agentId: ILivechatAgent['_id']) {
		const query: FilterQuery<ILivechatAgent> = {
			_id: agentId,
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		};

		const update: UpdateQuery<ILivechatAgent> = {
			$set: {
				statusLivechat: ILivechatAgentStatus.AVAILABLE,
			},
		};

		return this.update(query, update);
	}

	async isAgentWithinBusinessHours(agentId: ILivechatAgent['_id']) {
		const count = await this.find({
			_id: agentId,
			openBusinessHours: {
				$exists: true,
				$not: { $size: 0 },
			},
		}).count();
		return count > 0;
	}

	removeBusinessHoursFromAllUsers() {
		const query: FilterQuery<ILivechatAgent> = {
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

	// Voip functions
	findOneByAgentUsername(username: ILivechatAgent['username'], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query: FilterQuery<ILivechatAgent> = { username, roles: 'livechat-agent' };

		return this.findOne(query, options);
	}

	findOneByExtension(extension: string, options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query: FilterQuery<ILivechatAgent> = {
			extension,
		};

		return this.findOne(query, options);
	}

	findByExtensions(extensions: string[], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query: FilterQuery<ILivechatAgent> = {
			extension: {
				$in: extensions,
			},
		};

		return this.find(query, options);
	}

	getVoipExtensionByUserId(agentId: ILivechatAgent['_id'], options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
		const query: FilterQuery<ILivechatAgent> = {
			_id: agentId,
			extension: { $exists: true },
		};
		return this.findOne(query, options);
	}

	setExtension(agentId: ILivechatAgent['_id'], extension: string) {
		const query: FilterQuery<ILivechatAgent> = {
			_id: agentId,
		};

		const update: UpdateQuery<ILivechatAgent> = {
			$set: {
				extension,
			},
		};
		return this.update(query, update);
	}

	unsetExtension(agentId: ILivechatAgent['_id']) {
		const query = {
			_id: agentId,
		};
		const update: UpdateQuery<ILivechatAgent> = {
			$unset: {
				extension: true,
			},
		};
		return this.update(query, update);
	}

	getAvailableAgentsIncludingExt(includeExt: string, text: string, options: WithoutProjection<FindOneOptions<ILivechatAgent>>) {
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
}
