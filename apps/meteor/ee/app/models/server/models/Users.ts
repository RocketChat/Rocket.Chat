import { overwriteClassOnLicense } from '../../../license/server';
import { Users } from '../../../../../app/models/server/models/Users';

type AgentMetadata = {
	'agentId'?: string;
	'username'?: string;
	'lastAssignTime'?: Date;
	'lastRoutingTime'?: Date;
	'queueInfo.chats'?: number;
	[x: string]: any;
};

// get next agent ignoring the ones reached the max amount of active chats
const getUnavailableAgents = function (_: any, departmentId: string, customFilter: { [k: string]: any }[]): Promise<AgentMetadata[]> {
	// @ts-expect-error 'this' implicitly has type 'any' because it does not have a type annotation.
	const col = this.model.rawCollection() as any;

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

	return col
		.aggregate([
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
		])
		.toArray();
};

overwriteClassOnLicense('livechat-enterprise', Users, {
	getUnavailableAgents,
});

export default Users;
