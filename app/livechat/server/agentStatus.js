import { Meteor } from 'meteor/meteor';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

import { Livechat } from './lib/Livechat';
import { hasRole } from '../../authorization';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	Meteor.runAsUser(user._id, () => {
		if (hasRole(user._id, 'livechat-manager') || hasRole(user._id, 'livechat-monitor') || hasRole(user._id, 'livechat-agent')) {
			Livechat.notifyAgentStatusChanged(user._id, status);
		}
	});
});
