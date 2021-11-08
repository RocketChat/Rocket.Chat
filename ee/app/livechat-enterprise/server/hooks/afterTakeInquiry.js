import { callbacks } from '../../../../../app/callbacks';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

callbacks.add('livechat.afterTakeInquiry', async (inquiry) => {
	if (!inquiry) {
		cbLogger.debug('Skipping callback. No inquiry provided');
		return null;
	}

	const { department } = inquiry;
	debouncedDispatchWaitingQueueStatus(department);

	cbLogger.debug(`Statuses for queue ${ department || 'Public' } updated successfully`);
	return inquiry;
}, callbacks.priority.MEDIUM, 'livechat-after-take-inquiry');
