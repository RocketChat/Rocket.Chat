import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';
import { Users } from '../../models';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';
import { Livechat } from './lib/Livechat';

let agentsHandler;
let monitorAgents = false;
let actionTimeout = 60000;

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

function runAgentLeaveAction(userId) {
	const action = settings.get('Livechat_agent_leave_action');
	if (action === 'close') {
		return Livechat.closeOpenChats(userId, settings.get('Livechat_agent_leave_comment'));
	} else if (action === 'forward') {
		return Livechat.forwardOpenChats(userId);
	}
}

settings.get('Livechat_agent_leave_action_timeout', function(key, value) {
	actionTimeout = value * 1000;
});

settings.get('Livechat_agent_leave_action', function(key, value) {
	monitorAgents = value;
	if (value !== 'none') {
		if (!agentsHandler) {
			agentsHandler = Users.findOnlineAgents().observeChanges({
				added(id) {
					onlineAgents.add(id);
				},
				changed(id, fields) {
					if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
						onlineAgents.remove(id, () => {
							runAgentLeaveAction(id);
						});
					} else {
						onlineAgents.add(id);
					}
				},
				removed(id) {
					onlineAgents.remove(id, () => {
						runAgentLeaveAction(id);
					});
				},
			});
		}
	} else if (agentsHandler) {
		agentsHandler.stop();
		agentsHandler = null;
	}
});

UserPresenceMonitor.onSetUserStatus((user, status/* , statusConnection*/) => {
	if (!monitorAgents) {
		return;
	}
	if (onlineAgents.exists(user._id)) {
		if (status === 'offline' || user.statusLivechat === 'not-available') {
			onlineAgents.remove(user._id, () => {
				runAgentLeaveAction(user._id);
			});
		}
	}
});
