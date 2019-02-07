import { RocketChat } from 'meteor/rocketchat:lib';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	if (RocketChat.authz.hasRole(user._id, 'livechat-manager') || RocketChat.authz.hasRole(user._id, 'livechat-agent')) {
		RocketChat.Livechat.notifyAgentStatusChanged(user._id, status);
	}
});
