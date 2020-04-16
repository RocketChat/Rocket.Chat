import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { checkWaitingQueue, dispatchWaitingQueueStatus } from '../lib/Helper';

callbacks.add('livechat.afterTakeInquiry', async (inquiry) => {
	if (!settings.get('Livechat_waiting_queue')) {
		return inquiry;
	}

	if (!inquiry) {
		return null;
	}

	const { department } = inquiry;
	await dispatchWaitingQueueStatus(department);
	await checkWaitingQueue(department);

	return inquiry;
}, callbacks.priority.MEDIUM, 'livechat-after-take-inquiry');
