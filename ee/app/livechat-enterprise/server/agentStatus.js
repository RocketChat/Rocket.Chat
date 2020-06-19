import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

import { hasRole } from '../../../../app/authorization';
import { checkWaitingQueue } from './lib/Helper';
import { RoutingManager } from '../../../../app/livechat/server/lib/RoutingManager';

UserPresenceMonitor.onSetUserStatus((user, status) => {
	if (hasRole(user._id, 'livechat-agent') && status === 'online') {
		if (!RoutingManager.getConfig().autoAssignAgent) {
			return;
		}

		checkWaitingQueue();
	}
});
