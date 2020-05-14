import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { LivechatVisitors } from '../../../../../app/models/server';

callbacks.add('livechat.afterTakeInquiry', (inquiry, agent) => {
	if (!inquiry || !agent) {
		return inquiry;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return inquiry;
	}

	if (!settings.get('Livechat_last_chatted_agent_routing')) {
		return inquiry;
	}

	const { v: { token } = {} } = inquiry;
	if (!token) {
		return inquiry;
	}

	const { agentId: _id, username } = agent;
	LivechatVisitors.updateLastAgentByToken(token, { _id, username, ts: new Date() });

	return inquiry;
}, callbacks.priority.MEDIUM, 'livechat-save-default-agent-after-take-inquiry');
