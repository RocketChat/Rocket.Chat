import { callbacks } from '../../../../../app/callbacks';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings';
import { LivechatInquiry } from '../../../../../app/models/server';
import { processWaitingQueue } from '../lib/Helper';

callbacks.add('livechat.onMaxNumberSimultaneousChatsReached', (inquiry, agent) => {
	if (!inquiry || !inquiry.defaultAgent) {
		return inquiry;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return inquiry;
	}

	if (!settings.get('Livechat_last_chatted_agent_routing')) {
		return inquiry;
	}

	const { _id, defaultAgent, department } = inquiry;

	LivechatInquiry.removeDefaultAgentById(_id);

	const { _id: defaultAgentId } = defaultAgent;
	const { agentId } = agent;

	if (defaultAgentId === agentId) {
		processWaitingQueue(department);
	}

	return LivechatInquiry.findOneById(_id);
}, callbacks.priority.MEDIUM, 'livechat-on-max-number-simultaneous-chats-reached');
