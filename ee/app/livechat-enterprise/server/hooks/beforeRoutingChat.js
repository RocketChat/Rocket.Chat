import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { LivechatInquiry } from '../../../../../app/models/server';
import { dispatchInquiryPosition } from '../lib/Helper';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';

callbacks.add('livechat.beforeRouteChat', async (inquiry, agent) => {
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

	if (agent && allowAgentSkipQueue(agent)) {
		return inquiry;
	}

	saveQueueInquiry(inquiry);

	const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id, department });
	if (inq) {
		dispatchInquiryPosition(inq);
	}

	return LivechatInquiry.findOneById(_id);
}, callbacks.priority.HIGH, 'livechat-before-routing-chat');
