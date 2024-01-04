import moment from 'moment';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';
import { cbLogger } from '../lib/logger';

let timer = 0;

const scheduleInquiry = async (inquiry: any): Promise<void> => {
	if (!inquiry?._id) {
		return;
	}

	if (!inquiry?._updatedAt || !inquiry?._createdAt) {
		return;
	}

	// schedule individual jobs instead of property for close inactivty
	const newQueueTime = moment(inquiry._updatedAt || inquiry._createdAt).add(timer, 'minutes');
	cbLogger.debug(`Scheduling estimated close time at ${newQueueTime} for queued inquiry ${inquiry._id}`);
	await OmnichannelQueueInactivityMonitor.scheduleInquiry(inquiry._id, new Date(newQueueTime.format()));
};

settings.watch('Livechat_max_queue_wait_time', (value) => {
	timer = value as number;
	if (timer <= 0) {
		callbacks.remove('livechat.afterInquiryQueued', 'livechat-inquiry-queued-set-queue-timer');
		return;
	}
	callbacks.add('livechat.afterInquiryQueued', scheduleInquiry, callbacks.priority.HIGH, 'livechat-inquiry-queued-set-queue-timer');
});
