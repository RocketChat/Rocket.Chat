import moment from 'moment';

import { callbacks } from '../../../../../lib/callbacks';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

let timer = 0;

const scheduleInquiry = (inquiry: any): void => {
	if (!inquiry?._id) {
		cbLogger.debug('Skipping callback. No inquiry provided');
		return;
	}

	if (!inquiry?._updatedAt || !inquiry?._createdAt) {
		cbLogger.debug('Skipping callback. Inquiry doesnt have timestamps');
		return;
	}

	// schedule individual jobs instead of property for close inactivty
	const newQueueTime = moment(inquiry._updatedAt || inquiry._createdAt).add(timer, 'minutes');
	cbLogger.debug(`Scheduling estimated close time at ${newQueueTime} for queued inquiry ${inquiry._id}`);
	OmnichannelQueueInactivityMonitor.scheduleInquiry(inquiry._id, new Date(newQueueTime.format()));
};

settings.watch('Livechat_max_queue_wait_time', (value) => {
	timer = value as number;
	if (timer <= 0) {
		callbacks.remove('livechat.afterInquiryQueued', 'livechat-inquiry-queued-set-queue-timer');
		return;
	}
	callbacks.add('livechat.afterInquiryQueued', scheduleInquiry, callbacks.priority.HIGH, 'livechat-inquiry-queued-set-queue-timer');
});
