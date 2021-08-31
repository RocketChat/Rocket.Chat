import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { LivechatInquiry } from '../../../../../app/models/server';
import { dispatchInquiryPosition } from '../lib/Helper';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { logger } from '../lib/logger';

callbacks.add('livechat.beforeRouteChat', async (inquiry, agent) => {
	if (!settings.get('Livechat_waiting_queue')) {
		logger.cb.debug('Skipping callback. Waiting queue disabled by setting');
		return inquiry;
	}

	if (!inquiry) {
		logger.cb.debug('Skipping callback. No inquiry provided');
		return inquiry;
	}

	const { _id, status, department } = inquiry;

	if (status !== 'ready') {
		logger.cb.debug(`Skipping callback. Inquiry ${ _id } is ready`);
		return inquiry;
	}

	if (agent && allowAgentSkipQueue(agent)) {
		logger.cb.debug(`Skipping callback. Agent ${ agent.agentId } can skip queue`);
		return inquiry;
	}

	saveQueueInquiry(inquiry);

	const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id, department });
	if (inq) {
		dispatchInquiryPosition(inq);
	}

	logger.cb.debug(`Callback success. Inquiry ${ _id } position has been notified`);
	return LivechatInquiry.findOneById(_id);
}, callbacks.priority.HIGH, 'livechat-before-routing-chat');
