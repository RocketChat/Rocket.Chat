import { hasRole } from '../../../../app/authorization';
import { checkWaitingQueue } from './lib/Helper';
import { RoutingManager } from '../../../../app/livechat/server/lib/RoutingManager';
import { UserPresenceEvents } from '../../../../app/presence/server/monitor';

UserPresenceEvents.on('setUserStatus', (user, status) => {
	if (hasRole(user._id, 'livechat-agent') && status === 'online') {
		if (!RoutingManager.getConfig().autoAssignAgent) {
			return;
		}

		checkWaitingQueue();
	}
});
