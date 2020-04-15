import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { checkWaitingQueue, dispatchWaitingQueueStatus } from '../lib/Helper';
// import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add('livechat.afterTakeInquiry', async (inquiry) => {
	/*
	if (inquiry.omnichannel && inquiry.omnichannel.priority) {
		const priority = LivechatPriority.findOneById(inquiry.omnichannel.priority._id);
	}
	*/

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
