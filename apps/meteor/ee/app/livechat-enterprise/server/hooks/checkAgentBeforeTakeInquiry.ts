import { Users } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { getMaxNumberSimultaneousChat } from '../lib/Helper';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { cbLogger } from '../lib/logger';
import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';

const validateMaxChats = async ({
	agent,
	inquiry,
}: {
	agent: {
		agentId: string;
	};
	inquiry: {
		_id: string;
		department: string;
	};
	options: {
		forwardingToDepartment?: {
			oldDepartmentId: string;
			transferData: any;
		};
		clientAction?: boolean;
	};
}) => {
	if (!inquiry?._id || !agent?.agentId) {
		cbLogger.debug('Callback with error. No inquiry or agent provided');
		throw new Error('No inquiry or agent provided');
	}
	const { agentId } = agent;

	if (!(await Livechat.checkOnlineAgents(undefined, agent))) {
		cbLogger.debug('Callback with error. provided agent is not online');
		throw new Error('Provided agent is not online');
	}

	if (!settings.get('Livechat_waiting_queue')) {
		cbLogger.debug('Skipping callback. Disabled by setting');
		return agent;
	}

	if (await allowAgentSkipQueue(agent)) {
		cbLogger.debug(`Callback success. Agent ${agent.agentId} can skip queue`);
		return agent;
	}

	const { department: departmentId } = inquiry;

	const maxNumberSimultaneousChat = await getMaxNumberSimultaneousChat({
		agentId,
		departmentId,
	});

	if (maxNumberSimultaneousChat === 0) {
		cbLogger.debug(`Callback success. Agent ${agentId} max number simultaneous chats on range`);
		return agent;
	}

	const user = await Users.getAgentAndAmountOngoingChats(agentId);
	if (!user) {
		cbLogger.debug('Callback with error. No valid agent found');
		throw new Error('No valid agent found');
	}

	const { queueInfo: { chats = 0 } = {} } = user;
	const maxChats = typeof maxNumberSimultaneousChat === 'number' ? maxNumberSimultaneousChat : parseInt(maxNumberSimultaneousChat, 10);
	if (maxChats <= chats) {
		cbLogger.debug('Callback with error. Agent reached max amount of simultaneous chats');
		await callbacks.run('livechat.onMaxNumberSimultaneousChatsReached', inquiry);
		throw new Error('error-max-number-simultaneous-chats-reached');
	}

	cbLogger.debug(`Callback success. Agent ${agentId} can take inquiry ${inquiry._id}`);
	return agent;
};

callbacks.add('livechat.checkAgentBeforeTakeInquiry', validateMaxChats, callbacks.priority.MEDIUM, 'livechat-before-take-inquiry');
