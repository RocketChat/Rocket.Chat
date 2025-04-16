import { Users } from '@rocket.chat/models';

import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { checkOnlineAgents } from '../../../../../app/livechat/server/lib/service-status';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { isAgentWithinChatLimits } from '../lib/Helper';
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
		cbLogger.debug('No inquiry or agent provided');
		throw new Error('No inquiry or agent provided');
	}
	const { agentId } = agent;

	if (!(await checkOnlineAgents(undefined, agent))) {
		cbLogger.debug('Provided agent is not online');
		throw new Error('Provided agent is not online');
	}

	if (!settings.get('Livechat_waiting_queue')) {
		cbLogger.info(`Chat can be taken by Agent ${agentId}: waiting queue is disabled`);
		return agent;
	}

	if (await allowAgentSkipQueue(agent)) {
		cbLogger.info(`Chat can be taken by Agent ${agentId}: agent can skip queue`);
		return agent;
	}

	const { department: departmentId } = inquiry;
	const user = await Users.getAgentAndAmountOngoingChats(agentId, departmentId);
	if (!user) {
		cbLogger.debug({ msg: 'No valid agent found', agentId });
		throw new Error('No valid agent found');
	}

	const { queueInfo: { chats = 0, chatsForDepartment = 0 } = {} } = user;

	if (await isAgentWithinChatLimits({ agentId, departmentId, totalChats: chats, departmentChats: chatsForDepartment })) {
		return user;
	}
	throw new Error('error-max-number-simultaneous-chats-reached');
};

callbacks.add('livechat.checkAgentBeforeTakeInquiry', validateMaxChats, callbacks.priority.MEDIUM, 'livechat-before-take-inquiry');
