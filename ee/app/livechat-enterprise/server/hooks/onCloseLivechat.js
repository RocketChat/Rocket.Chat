import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { dispatchWaitingQueueStatus } from '../lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';

const onCloseLivechat = (room) => {
	if (!settings.get('Livechat_waiting_queue')) {
		return room;
	}

	const { departmentId } = room || {};
	if (!RoutingManager.getConfig().autoAssignAgent) {
		dispatchWaitingQueueStatus(departmentId);
		return room;
	}

	return room;
};

callbacks.add('livechat.closeRoom', onCloseLivechat, callbacks.priority.HIGH, 'livechat-waiting-queue-monitor-close-room');
