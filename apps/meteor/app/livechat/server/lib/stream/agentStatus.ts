import { Logger } from '@rocket.chat/logger';

import { settings } from '../../../../settings/server';
import { closeOpenChats } from '../closeRoom';
import { forwardOpenChats } from '../transfer';

const logger = new Logger('AgentStatusWatcher');

export let monitorAgents = false;
let actionTimeout = 60000;
let action = 'none';
let comment = '';

settings.watch('Livechat_agent_leave_action_timeout', (value) => {
	if (typeof value !== 'number') {
		return;
	}
	actionTimeout = value * 1000;
});

settings.watch('Livechat_agent_leave_action', (value) => {
	monitorAgents = value !== 'none';
	action = value as string;
});

settings.watch('Livechat_agent_leave_comment', (value) => {
	if (typeof value !== 'string') {
		return;
	}
	comment = value;
});

export const onlineAgents = {
	users: new Set(),
	queue: new Map(),

	add(userId: string): void {
		if (this.exists(userId)) {
			return;
		}

		if (this.queue.has(userId)) {
			clearTimeout(this.queue.get(userId));
			this.queue.delete(userId);
		}
		this.users.add(userId);
	},

	remove(userId: string): void {
		if (!this.exists(userId)) {
			return;
		}
		this.users.delete(userId);

		if (this.queue.has(userId)) {
			clearTimeout(this.queue.get(userId));
		}

		this.queue.set(userId, setTimeout(this.runAgentLeaveAction, actionTimeout, userId));
	},

	exists(userId: string): boolean {
		return this.users.has(userId);
	},

	runAgentLeaveAction: async (userId: string) => {
		onlineAgents.users.delete(userId);
		onlineAgents.queue.delete(userId);

		try {
			if (action === 'close') {
				return await closeOpenChats(userId, comment);
			}

			if (action === 'forward') {
				return await forwardOpenChats(userId);
			}
		} catch (e) {
			logger.error({
				msg: `Cannot perform action ${action}`,
				err: e,
			});
		}
	},
};
