import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../models/server';
import { settings } from '../../../../settings';
import { Livechat } from '../Livechat';

let monitorAgents = false;
let actionTimeout = 60000;

settings.get('Livechat_agent_leave_action_timeout', function(key, value) {
	actionTimeout = value * 1000;
});

settings.get('Livechat_agent_leave_action', function(key, value) {
	monitorAgents = value;
});

const onlineAgents = {
	users: {},
	queue: {},

	add(userId) {
		if (this.queue[userId]) {
			clearTimeout(this.queue[userId]);
			delete this.queue[userId];
		}
		this.users[userId] = 1;
	},

	remove(userId, callback) {
		if (this.queue[userId]) {
			clearTimeout(this.queue[userId]);
		}
		this.queue[userId] = setTimeout(Meteor.bindEnvironment(() => {
			callback();

			delete this.users[userId];
			delete this.queue[userId];
		}), actionTimeout);
	},

	exists(userId) {
		return !!this.users[userId];
	},
};

const runAgentLeaveAction = (userId) => {
	const action = settings.get('Livechat_agent_leave_action');
	if (action === 'close') {
		return Livechat.closeOpenChats(userId, settings.get('Livechat_agent_leave_comment'));
	} if (action === 'forward') {
		return Livechat.forwardOpenChats(userId);
	}
};

const userWasAgent = (id) => {
	const removedUser = Users.trashFindOneById(id);
	if (!removedUser) {
		return false;
	}

	const { roles } = removedUser;
	if (!roles || !Array.isArray(roles) || !roles.includes('livechat-agent')) {
		return false;
	}

	return true;
};

Users.on('change', ({ clientAction, id, diff }) => {
	if (!monitorAgents) {
		return;
	}

	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
		return;
	}

	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const agent = Users.findOneAgentById(id);
			const serviceOnline = agent && agent.status !== 'offline' && agent.statusLivechat === 'available';

			if (agent && serviceOnline && !onlineAgents.exists(id)) {
				return onlineAgents.add(id);
			}

			if (onlineAgents.exists(id) && (!agent || !serviceOnline)) {
				onlineAgents.remove(id, () => {
					runAgentLeaveAction(id);
				});
			}

			break;
		case 'removed':
			if (userWasAgent(id) && onlineAgents.exists(id)) {
				onlineAgents.remove(id, () => {
					runAgentLeaveAction(id);
				});
			}
			break;
	}
});
