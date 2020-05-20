import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { LivechatInquiry } from '../../../../../app/models/server';
import { dispatchInquiryPosition, checkWaitingQueue } from '../lib/Helper';

callbacks.add('livechat.beforeRouteChat', async (inquiry) => {
	if (!settings.get('Livechat_waiting_queue')) {
		return inquiry;
	}

	if (!inquiry) {
		return inquiry;
	}

	const { _id, status, department } = inquiry;

	if (status !== 'ready') {
		return inquiry;
	}

	LivechatInquiry.queueInquiry(_id);

	const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id });
	if (inq) {
		dispatchInquiryPosition(inq);
	}

	await checkWaitingQueue(department);

	return LivechatInquiry.findOneById(_id);
}, callbacks.priority.HIGH, 'livechat-before-routing-chat');
