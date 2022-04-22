import { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents } from '../../../../models/server/raw';

interface IFindAgentDepartmentsParams {
	userId: string;
	enabledDepartmentsOnly: boolean | string | undefined;
	agentId: string;
}

export async function findAgentDepartments({
	userId,
	enabledDepartmentsOnly,
	agentId,
}: IFindAgentDepartmentsParams): Promise<{ departments: ILivechatDepartmentAgents[] }> {
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
