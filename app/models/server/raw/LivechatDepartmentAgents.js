import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentAgentsRaw extends BaseRaw {
	findUsersInQueue(usersList, options) {
		const query = {};

		if (Array.isArray(usersList) && usersList.length) {
			query.username = {
				$in: usersList,
			};
		}
		return this.find(query, options);
	}

	findByAgentId(agentId) {
		return this.find({ agentId });
	}

	findActiveDepartmentsByAgentId(agentId, options) {
		const query = {
			agentId,
			departmentEnabled: true,
		};
		return this.find(query, options);
	}
}
