import { Match, check } from 'meteor/check';

import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { checkWaitingQueue } from '../lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';

callbacks.add('livechat.setUserStatusLivechat', (user) => {
	check(user, Match.ObjectIncluding({
		userId: String,
		status: String,
	}));

	const { status } = user;
	if (status !== 'available') {
		return user;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return user;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return user;
	}

	checkWaitingQueue();

	return user;
}, callbacks.priority.MEDIUM, 'livechat-set-user-status');
