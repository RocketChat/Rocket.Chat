import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

const afterTakeInquiry = async (inquiry) => {
	if (!settings.get('Livechat_waiting_queue')) {
		cbLogger.debug('Skipping callback. Waiting queue disabled by setting');
		return inquiry;
	}

	if (!inquiry) {
		cbLogger.debug('Skipping callback. No inquiry provided');
		return null;
	}

	const { department } = inquiry;
	debouncedDispatchWaitingQueueStatus(department);

	cbLogger.debug(`Statuses for queue ${department || 'Public'} updated successfully`);
	return inquiry;
};

callbacks.add(
	'livechat.afterTakeInquiry',
	(inquiry) => Promise.await(afterTakeInquiry(inquiry)),
	callbacks.priority.MEDIUM,
	'livechat-after-take-inquiry',
);
