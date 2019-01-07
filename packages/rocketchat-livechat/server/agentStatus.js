import { RocketChat } from 'meteor/rocketchat:lib';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	RocketChat.Livechat.notifyAgentStatusChanged(user._id, status);
});
