import { hasRole } from 'meteor/rocketchat:authorization';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';
import { Livechat } from './lib/Livechat';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	if (hasRole(user._id, 'livechat-manager') || hasRole(user._id, 'livechat-agent')) {
		Livechat.notifyAgentStatusChanged(user._id, status);
	}
});
