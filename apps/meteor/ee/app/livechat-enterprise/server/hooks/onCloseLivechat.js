import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

const onCloseLivechat = (room) => {
	Promise.await(LivechatEnterprise.releaseOnHoldChat(room));

	if (!settings.get('Livechat_waiting_queue')) {
		return room;
	}

	const { departmentId } = room || {};
	debouncedDispatchWaitingQueueStatus(departmentId);

	return room;
};

callbacks.add('livechat.closeRoom', onCloseLivechat, callbacks.priority.HIGH, 'livechat-waiting-queue-monitor-close-room');
