import type { ILivechatAgent, ILivechatDepartment, SelectedAgent } from '@rocket.chat/core-typings';
import { Users, LivechatDepartmentAgents, LivechatDepartment } from '@rocket.chat/models';
import type { FindCursor } from 'mongodb';

import { livechatLogger } from './logger';
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

export async function online(department?: string, skipNoAgentSetting = false, skipFallbackCheck = false): Promise<boolean> {
	livechatLogger.debug(`Checking online agents ${department ? `for department ${department}` : ''}`);
	if (!skipNoAgentSetting && settings.get('Livechat_accept_chats_with_no_agents')) {
		livechatLogger.debug('Can accept without online agents: true');
		return true;
	}

	if (settings.get('Livechat_assign_new_conversation_to_bot')) {
		livechatLogger.debug(`Fetching online bot agents for department ${department}`);
		// get & count where doing the same, but get was getting data, while count was only counting.  We only need the count here
		const botAgents = await countBotAgents(department);
		if (botAgents) {
			livechatLogger.debug(`Found ${botAgents} online`);
			if (botAgents > 0) {
				return true;
			}
		}
	}

	const agentsOnline = await checkOnlineAgents(department, undefined, skipFallbackCheck);
	livechatLogger.debug(`Are online agents ${department ? `for department ${department}` : ''}?: ${agentsOnline}`);
	return agentsOnline;
}

export async function checkOnlineAgents(department?: string, agent?: { agentId: string }, skipFallbackCheck = false): Promise<boolean> {
	if (agent?.agentId) {
		return Users.checkOnlineAgents(agent.agentId, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
	}

	if (department) {
		const onlineForDep = await LivechatDepartmentAgents.checkOnlineForDepartment(department);
		if (onlineForDep || skipFallbackCheck) {
			return onlineForDep;
		}

		const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'fallbackForwardDepartment'>>(department, {
			projection: { fallbackForwardDepartment: 1 },
		});
		if (!dep?.fallbackForwardDepartment) {
			return onlineForDep;
		}

		return checkOnlineAgents(dep?.fallbackForwardDepartment);
	}

	return Users.checkOnlineAgents(undefined, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
}

async function countBotAgents(department?: string) {
	if (department) {
		return LivechatDepartmentAgents.countBotsForDepartment(department);
	}

	return Users.countBotAgents();
}
