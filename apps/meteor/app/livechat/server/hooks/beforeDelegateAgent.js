import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { Users, LivechatDepartmentAgents } from '../../../models/server';

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
			return Promise.await(LivechatDepartmentAgents.getNextBotForDepartment(department));
		}

		return Promise.await(Users.getNextBotAgent());
	},
	callbacks.priority.HIGH,
	'livechat-before-delegate-agent',
);
