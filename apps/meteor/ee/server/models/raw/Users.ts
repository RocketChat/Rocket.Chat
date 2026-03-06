import type { RocketChatRecordDeleted, IUser, AvailableAgentsAggregation } from '@rocket.chat/core-typings';
import { UsersRaw } from '@rocket.chat/models';
import type { Db, Collection, Filter } from 'mongodb';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

declare module '@rocket.chat/model-typings' {
	interface IUsersModel {
		getUnavailableAgents(
			departmentId: string,
			customFilter: Filter<AvailableAgentsAggregation>,
		): Promise<Pick<AvailableAgentsAggregation, 'username'>[]>;
	}
}

export class UsersEE extends UsersRaw {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUser>>) {
		super(db, trash);
	}

	override getUnavailableAgents(
		departmentId: string,
		customFilter: Filter<AvailableAgentsAggregation>,
	): Promise<Pick<AvailableAgentsAggregation, 'username'>[]> {
		// if department is provided, remove the agents that are not from the selected department
		const departmentFilter = departmentId
			? [
					{
						$lookup: {
							from: 'rocketchat_livechat_department_agents',
							localField: '_id',
							foreignField: 'agentId',
							as: 'department',
						},
					},
					{
						$addFields: {
							department: {
								$filter: {
									input: '$department',
									as: 'dept',
									cond: { $eq: ['$$dept.departmentId', departmentId] },
								},
							},
						},
					},
					{
						$match: { department: { $size: 1 } },
					},
				]
			: [];

		return this.col
			.aggregate<AvailableAgentsAggregation>(
				[
					{
						$match: {
							status: { $exists: true, $ne: 'offline' },
							statusLivechat: 'available',
							roles: 'livechat-agent',
						},
					},
					...departmentFilter,
					{
						$lookup: {
							from: 'rocketchat_subscription',
							localField: '_id',
							foreignField: 'u._id',
							as: 'subs',
						},
					},
					{
						$addFields: {
							subs: {
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
					{
						$project: {
							'agentId': '$_id',
							'maxChatsForAgent': { $convert: { input: '$livechat.maxNumberSimultaneousChat', to: 'double', onError: 0, onNull: 0 } },
							'username': 1,
							...(departmentId
								? {
										'queueInfo.chatsForDepartment': {
											$size: {
												$filter: {
													input: '$subs',
													as: 'sub',
													cond: {
														$and: [{ $eq: ['$$sub.department', departmentId] }],
													},
												},
											},
										},
									}
								: {}),
							'queueInfo.chats': {
								$size: '$subs',
							},
						},
					},
					...(customFilter ? [customFilter] : []),
					{ $project: { username: 1 } },
				],
				{ allowDiskUse: true, readPreference: readSecondaryPreferred() },
			)
			.toArray();
	}
}
