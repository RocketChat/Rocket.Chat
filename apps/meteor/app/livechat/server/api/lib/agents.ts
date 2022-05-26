import { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

import { LivechatDepartmentAgents } from '../../../../models/server/raw';

export async function findAgentDepartments({
	enabledDepartmentsOnly,
	agentId,
}: {
	enabledDepartmentsOnly?: boolean;
	agentId: string;
}): Promise<{ departments: ILivechatDepartmentAgents[] }> {
	if (enabledDepartmentsOnly) {
		return {
			departments: await LivechatDepartmentAgents.findActiveDepartmentsByAgentId(agentId).toArray(),
		};
	}

	return {
		departments: await LivechatDepartmentAgents.find({ agentId }).toArray(),
	};
}
