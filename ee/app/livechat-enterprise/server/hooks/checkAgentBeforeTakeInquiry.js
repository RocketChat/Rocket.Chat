import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks';
import { Users } from '../../../../../app/models/server/raw';
import { settings } from '../../../../../app/settings';
import { allowAgentSkipQueue, getMaxNumberSimultaneousChat } from '../lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';

callbacks.add('livechat.checkAgentBeforeTakeInquiry', async (agent, inquiry) => {
	if (!settings.get('Livechat_waiting_queue')) {
		return agent;
	}

	if (!inquiry || !agent) {
		return null;
	}

	if (allowAgentSkipQueue(agent)) {
		return agent;
	}

	const { department: departmentId } = inquiry;
	const { agentId } = agent;

	const maxNumberSimultaneousChat = getMaxNumberSimultaneousChat({ agentId, departmentId });
	if (maxNumberSimultaneousChat === 0) {
		return agent;
	}

	const user = await Users.getAgentAndAmountOngoingChats(agentId);
	if (!user) {
		return null;
	}

	const { queueInfo: { chats = 0 } = {} } = user;
	if (maxNumberSimultaneousChat <= chats) {
		callbacks.run('livechat.onMaxNumberSimultaneousChatsReached', inquiry);

		if (!RoutingManager.getConfig().autoAssignAgent) {
			throw new Meteor.Error('error-max-number-simultaneous-chats-reached', 'Not allowed');
		}

		return null;
	}
	return agent;
}, callbacks.priority.MEDIUM, 'livechat-before-take-inquiry');
