import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.afterTakeInquiry',
	async ({ inquiry }) => {
		if (!settings.get('Livechat_waiting_queue')) {
			return inquiry;
		}

		if (!inquiry) {
			return null;
		}

		const { department } = inquiry;
		debouncedDispatchWaitingQueueStatus(department);

		cbLogger.debug(`Statuses for queue ${department || 'Public'} updated successfully`);
		return inquiry;
	},
	callbacks.priority.MEDIUM,
	'livechat-after-take-inquiry',
);
