import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

const onCloseLivechat = async (params) => {
	const { room } = params;

	await LivechatEnterprise.releaseOnHoldChat(room);

	if (!settings.get('Livechat_waiting_queue')) {
		return params;
	}

	const { departmentId } = room || {};
	debouncedDispatchWaitingQueueStatus(departmentId);

	return params;
};

callbacks.add('livechat.closeRoom', onCloseLivechat, callbacks.priority.HIGH, 'livechat-waiting-queue-monitor-close-room');
