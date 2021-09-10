import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { dispatchWaitingQueueStatus } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

callbacks.add('livechat.afterTakeInquiry', async (inquiry) => {
	if (!settings.get('Livechat_waiting_queue')) {
		cbLogger.debug('Skipping callback. Waiting queue disabled by setting');
		return inquiry;
	}

	if (!inquiry) {
		cbLogger.debug('Skipping callback. No inquiry provided');
		return null;
	}

	const { department } = inquiry;
	await dispatchWaitingQueueStatus(department);

	cbLogger.debug(`Statuses for queue ${ department || 'Public' } updated succesfully`);
	return inquiry;
}, callbacks.priority.MEDIUM, 'livechat-after-take-inquiry');
