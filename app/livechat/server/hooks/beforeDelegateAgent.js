
import { callbacks } from '../../../callbacks';
import { settings } from '../../../settings';
import { Users, LivechatDepartmentAgents } from '../../../models';

callbacks.add('livechat.beforeDelegateAgent', (options = {}) => {
	const { department, agent } = options;

	if (agent) {
		return agent;
	}

	if (!settings.get('Livechat_assign_new_conversation_to_bot')) {
		return null;
	}

	if (department) {
		return LivechatDepartmentAgents.getNextBotForDepartment(department);
	}

	return Users.getNextBotAgent();
}, callbacks.priority.HIGH, 'livechat-before-delegate-agent');
