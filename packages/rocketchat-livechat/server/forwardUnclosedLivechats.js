/* globals UserPresenceMonitor */

let agentsHandler;
let monitorAgents = false;
let forwardChatTimeout = 60000;

RocketChat.onlineAgents = onlineAgents = {
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
		}), forwardChatTimeout);
	},

	exists(userId) {
		return !!this.users[userId];
	}
};

RocketChat.settings.get('Livechat_forward_open_chats_timeout', function(key, value) {
	forwardChatTimeout = value * 1000;
});

RocketChat.settings.get('Livechat_forward_open_chats', function(key, value) {
	monitorAgents = value;
	if (value) {
		if (!agentsHandler) {
			agentsHandler = RocketChat.models.Users.findOnlineAgents().observeChanges({
				added(id) {
					onlineAgents.add(id);
				},
				changed(id, fields) {
					if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
						onlineAgents.remove(id, () => {
							RocketChat.Livechat.forwardOpenChats(id);
						});
					} else {
						onlineAgents.add(id);
					}
				},
				removed(id) {
					onlineAgents.remove(id, () => {
						RocketChat.Livechat.forwardOpenChats(id);
					});
				}
			});
		}
	} else if (agentsHandler) {
		agentsHandler.stop();
		agentsHandler = null;
	}
});

UserPresenceMonitor.onSetUserStatus((user, status, statusConnection) => {
	if (!monitorAgents) {
		return;
	}
	if (onlineAgents.exists(user._id)) {
		if (statusConnection === 'offline' || user.statusLivechat === 'not-available') {
			onlineAgents.remove(user._id, () => {
				RocketChat.Livechat.forwardOpenChats(user._id);
			});
		}
	}
});
