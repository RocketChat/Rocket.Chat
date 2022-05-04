import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents } from '../../../../models/server/raw';

export async function findAgentDepartments({ userId, enabledDepartmentsOnly, agentId }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	if (enabledDepartmentsOnly) {
		return {
			departments: await LivechatDepartmentAgents.findActiveDepartmentsByAgentId(agentId).toArray(),
		};
	}

	return {
		departments: await LivechatDepartmentAgents.find({ agentId }).toArray(),
	};
}
