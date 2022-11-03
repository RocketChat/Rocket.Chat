import { LivechatDepartmentAgents } from '@rocket.chat/models';

export async function findAgentDepartments({ enabledDepartmentsOnly, agentId }) {
	if (enabledDepartmentsOnly) {
		return {
			departments: await LivechatDepartmentAgents.findActiveDepartmentsByAgentId(agentId).toArray(),
		};
	}

	return {
		departments: await LivechatDepartmentAgents.find({ agentId }).toArray(),
	};
}
