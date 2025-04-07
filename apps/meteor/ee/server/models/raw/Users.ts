import type { RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import { UsersRaw } from '@rocket.chat/models';
import type { Db, Collection } from 'mongodb';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

type AgentMetadata = {
	'agentId'?: string;
	'username'?: string;
	'lastAssignTime'?: Date;
	'lastRoutingTime'?: Date;
	'queueInfo.chats'?: number;
	[x: string]: any;
};

declare module '@rocket.chat/model-typings' {
	interface IUsersModel {
		getUnavailableAgents(departmentId: string, customFilter: { [k: string]: any }[]): Promise<AgentMetadata[]>;
	}
}

export class UsersEE extends UsersRaw {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUser>>) {
		super(db, trash);
	}

	getUnavailableAgents(departmentId: string, customFilter: { [k: string]: any }[]): Promise<AgentMetadata[]> {
		// if department is provided, remove the agents that are not from the selected department
		const departmentFilter = departmentId
			? [
					{
						$lookup: {
							from: 'rocketchat_livechat_department_agents',
							let: { userId: '$_id' },
							pipeline: [
								{
									$match: { $expr: { $eq: ['$$userId', '$agentId'] } },
								},
								{
									$match: { $expr: { $eq: ['$departmentId', departmentId] } },
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

		return this.col
			.aggregate(
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
						$project: {
							'agentId': '$_id',
							'livechat.maxNumberSimultaneousChat': 1,
							'username': 1,
							'lastAssignTime': 1,
							'lastRoutingTime': 1,
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
					...(customFilter ? [customFilter] : []),
					{
						$sort: {
							'queueInfo.chats': 1,
							'lastAssignTime': 1,
							'lastRoutingTime': 1,
							'username': 1,
						},
					},
				],
				{ allowDiskUse: true, readPreference: readSecondaryPreferred() },
			)
			.toArray();
	}
}
