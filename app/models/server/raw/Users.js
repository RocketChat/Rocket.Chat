import { BaseRaw } from './BaseRaw';

import { Users } from '..';

export class UsersRaw extends BaseRaw {
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
	}

	getDistinctFederationPeers() {
		return this.col.distinct('federation.peer', { federation: { $exists: true } });
	}

	async getNextLeastBusyAgent(department) {
		const aggregate = [
			{ $match: { status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent' } },
			{ $lookup: { from: 'view_livechat_queue_status', localField: '_id', foreignField: '_id', as: 'LivechatQueueStatus' } }, // the `view_livechat_queue_status` it's a view created when the server starts
			{ $lookup: { from: 'rocketchat_livechat_department_agents', localField: '_id', foreignField: 'agentId', as: 'departments' } },
			{ $project: { agentId: '$_id', username: 1, lastRoutingTime: 1, departments: 1, queueInfo: { $arrayElemAt: ['$LivechatQueueStatus', 0] } } },
			{ $sort: { 'queueInfo.chats': 1, lastRoutingTime: 1, username: 1 } },
		];

		if (department) {
			aggregate.push({ $unwind: '$departments' });
			aggregate.push({ $match: { 'departments.departmentId': department } });
		}

		aggregate.push({ $limit: 1 });

		const [agent] = await this.col.aggregate(aggregate).toArray();
		if (agent) {
			Users.setLastRoutingTime(agent.agentId);
		}

		return agent;
	}

	async getAgentAndAmountOngoingChats(userId) {
		const aggregate = [
			{ $match: { _id: userId, status: { $exists: true, $ne: 'offline' }, statusLivechat: 'available', roles: 'livechat-agent' } },
			{ $lookup: { from: 'view_livechat_queue_status', localField: '_id', foreignField: '_id', as: 'LivechatQueueStatus' } },
			{ $project: { username: 1, queueInfo: { $arrayElemAt: ['$LivechatQueueStatus', 0] } } },
		];

		const [agent] = await this.col.aggregate(aggregate).toArray();
		return agent;
	}
}
