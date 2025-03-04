import type { ILivechatAgent, SelectedAgent } from '@rocket.chat/core-typings';
import { Users, LivechatDepartmentAgents } from '@rocket.chat/models';
import type { FindCursor } from 'mongodb';

import { settings } from '../../../settings/server';

export async function getOnlineAgents(department?: string, agent?: SelectedAgent | null): Promise<FindCursor<ILivechatAgent> | undefined> {
	if (agent?.agentId) {
		return Users.findOnlineAgents(agent.agentId, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
	}

	if (department) {
		const departmentAgents = await LivechatDepartmentAgents.getOnlineForDepartment(department);
		if (!departmentAgents) {
			return;
		}

		const agentIds = await departmentAgents.map(({ agentId }) => agentId).toArray();
		if (!agentIds.length) {
			return;
		}

		return Users.findByIds<ILivechatAgent>([...new Set(agentIds)]);
	}
	return Users.findOnlineAgents(undefined, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
}
