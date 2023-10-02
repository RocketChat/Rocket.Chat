import type { RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import type { Db, Collection } from 'mongodb';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { UsersRaw } from '../../../../server/models/raw/Users';

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

	// @ts-expect-error - typings are good, but JS is not helping
	getUnavailableAgents(departmentId: string, customFilter: { [k: string]: any }[]): Promise<AgentMetadata[]> {
		// if department is provided, remove the agents that are not from the selected department
		const departmentFilter = departmentId
			? [
					{
						$lookup: {
							from: 'rocketchat_livechat_department_agents',
							let: { departmentId: '$departmentId', agentId: '$agentId' },
							pipeline: [
								{
									$match: { $expr: { $eq: ['$$agentId', '$_id'] } },
								},
								{
									$match: { $expr: { $eq: ['$$departmentId', departmentId] } },
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
