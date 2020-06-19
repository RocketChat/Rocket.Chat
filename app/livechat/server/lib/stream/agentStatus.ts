import { Meteor } from 'meteor/meteor';

import { Livechat } from '../Livechat';
import { settings } from '../../../../settings/server';
import { Users } from '../../../../models/server';

let monitorAgents = false;
let actionTimeout = 60000;
let action = 'none';
let comment = '';

settings.get('Livechat_agent_leave_action_timeout', (_key, value) => {
	if (typeof value !== 'number') {
		return;
	}
	actionTimeout = value * 1000;
});

settings.get('Livechat_agent_leave_action', (_key, value) => {
	if (typeof value !== 'boolean') {
		return;
	}
	monitorAgents = value;
});

settings.get('Livechat_agent_leave_action', (_key, value) => {
	if (typeof value !== 'string') {
		return;
	}
	action = value;
});

settings.get('Livechat_agent_leave_comment', (_key, value) => {
	if (typeof value !== 'string') {
		return;
	}
	comment = value;
});

const onlineAgents = {
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

		if (this.queue.has(userId)) {
			clearTimeout(this.queue.get(userId));
		}

		this.queue.set(userId, setTimeout(this.runAgentLeaveAction, actionTimeout, userId));
	},

	exists(userId: string): boolean {
		return this.users.has(userId);
	},

	runAgentLeaveAction: Meteor.bindEnvironment((userId: string) => {
		onlineAgents.users.delete(userId);
		onlineAgents.queue.delete(userId);

		if (action === 'close') {
			return Livechat.closeOpenChats(userId, comment);
		}

		if (action === 'forward') {
			return Livechat.forwardOpenChats(userId);
		}
	}),
};

Users.on('change', ({ clientAction, id, diff }) => {
	if (!monitorAgents) {
		return;
	}

	if (clientAction !== 'removed' && diff && !diff.status && !diff.statusLivechat) {
		return;
	}

	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const agent = Users.findOneAgentById(id, {
				fields: {
					status: 1,
					statusLivechat: 1,
				},
			});
			const serviceOnline = agent && agent.status !== 'offline' && agent.statusLivechat === 'available';

			if (serviceOnline) {
				return onlineAgents.add(id);
			}

			onlineAgents.remove(id);

			break;
		case 'removed':
			onlineAgents.remove(id);
			break;
	}
});
