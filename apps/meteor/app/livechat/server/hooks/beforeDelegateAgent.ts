import { LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

callbacks.add(
	'livechat.beforeDelegateAgent',
	async (agent, { department } = {}) => {
		if (agent) {
			return agent;
		}

		if (!settings.get('Livechat_assign_new_conversation_to_bot')) {
			return null;
		}

		if (department) {
			const livechatDepartmentAgent = await LivechatDepartmentAgents.getNextBotForDepartment(department);

			if (livechatDepartmentAgent) {
				const { agentId, departmentId, _id } = livechatDepartmentAgent;
				void notifyOnLivechatDepartmentAgentChanged({ agentId, departmentId, _id });
			}

			return livechatDepartmentAgent;
		}

		return Users.getNextBotAgent();
	},
	callbacks.priority.HIGH,
	'livechat-before-delegate-agent',
);
