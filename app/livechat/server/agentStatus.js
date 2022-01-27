import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

import { Livechat } from './lib/Livechat';
import { hasAnyRole } from '../../authorization/server/functions/hasRole';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	if (hasAnyRole(user._id, ['livechat-manager', 'livechat-monitor', 'livechat-agent'])) {
		Livechat.notifyAgentStatusChanged(user._id, status);
	}
});
