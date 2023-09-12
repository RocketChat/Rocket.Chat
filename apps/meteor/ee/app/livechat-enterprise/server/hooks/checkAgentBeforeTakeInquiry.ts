import { Users } from '@rocket.chat/models';

import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { getMaxNumberSimultaneousChat } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

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
		throw new Error('No inquiry or agent provided');
	}
	const { agentId } = agent;

	if (!(await Livechat.checkOnlineAgents(undefined, agent))) {
		throw new Error('Provided agent is not online');
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return agent;
	}

	if (await allowAgentSkipQueue(agent)) {
		cbLogger.info(`Chat can be taken by Agent ${agentId}: agent can skip queue`);
		return agent;
	}

	const { department: departmentId } = inquiry;

	const maxNumberSimultaneousChat = await getMaxNumberSimultaneousChat({
		agentId,
		departmentId,
	});

	if (maxNumberSimultaneousChat === 0) {
		cbLogger.debug(`Chat can be taken by Agent ${agentId}: max number simultaneous chats on range`);
		return agent;
	}

	const user = await Users.getAgentAndAmountOngoingChats(agentId);
	if (!user) {
		throw new Error('No valid agent found');
	}

	const { queueInfo: { chats = 0 } = {} } = user;
	const maxChats = typeof maxNumberSimultaneousChat === 'number' ? maxNumberSimultaneousChat : parseInt(maxNumberSimultaneousChat, 10);
	if (maxChats <= chats) {
		await callbacks.run('livechat.onMaxNumberSimultaneousChatsReached', inquiry);
		throw new Error('error-max-number-simultaneous-chats-reached');
	}

	cbLogger.debug(`Agent ${agentId} can take inquiry ${inquiry._id}`);
	return agent;
};

callbacks.add('livechat.checkAgentBeforeTakeInquiry', validateMaxChats, callbacks.priority.MEDIUM, 'livechat-before-take-inquiry');
