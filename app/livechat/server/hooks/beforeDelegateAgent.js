import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings';
import { Users, LivechatDepartmentAgents } from '../../../models';

callbacks.add(
	'livechat.beforeDelegateAgent',
	(agent, { department }) => {
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
	},
	callbacks.priority.HIGH,
	'livechat-before-delegate-agent',
);
