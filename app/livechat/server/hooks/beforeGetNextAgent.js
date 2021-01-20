
import { callbacks } from '../../../callbacks';
import { settings } from '../../../settings';
import { Users, LivechatDepartmentAgents } from '../../../models';

callbacks.add('livechat.beforeGetNextAgent', (department, ignoreAgentId) => {
	if (!settings.get('Livechat_assign_new_conversation_to_bot')) {
		return null;
	}

	if (department) {
		return LivechatDepartmentAgents.getNextBotForDepartment(department, ignoreAgentId);
	}

	return Users.getNextBotAgent(ignoreAgentId);
}, callbacks.priority.HIGH, 'livechat-before-get-next-agent');
