import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents } from '@rocket.chat/models';

export async function findAgentDepartments({
	enabledDepartmentsOnly,
	agentId,
}: {
	enabledDepartmentsOnly?: boolean;
	agentId: string;
}): Promise<{ departments: (ILivechatDepartmentAgents & { departmentName: string })[] }> {
	return {
		departments: await LivechatDepartmentAgents.findDepartmentsOfAgent(agentId, enabledDepartmentsOnly).toArray(),
	};
}
