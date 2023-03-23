import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

callbacks.add(
	'livechat.closeRoom',
	async (params) => {
		const { room } = params;

		await LivechatEnterprise.releaseOnHoldChat(room);

		if (!settings.get('Livechat_waiting_queue')) {
			return params;
		}

		const { departmentId } = room || {};
		debouncedDispatchWaitingQueueStatus(departmentId);

		return params;
	},
	callbacks.priority.HIGH,
	'livechat-waiting-queue-monitor-close-room',
);
