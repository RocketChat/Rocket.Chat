import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import moment from 'moment';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';
import { cbLogger } from '../lib/logger';

export const withTimer = (timer: number) => {
	return async (inquiry: ILivechatInquiryRecord) => {
		if (!inquiry?._id || !inquiry?._updatedAt) {
			return;
		}

		// schedule individual jobs instead of property for close inactivty
		const newQueueTime = moment(inquiry._updatedAt).add(timer, 'minutes');
		cbLogger.debug(`Scheduling estimated close time at ${newQueueTime} for queued inquiry ${inquiry._id}`);
		await OmnichannelQueueInactivityMonitor.scheduleInquiry(inquiry._id, new Date(newQueueTime.format()));
	};
};

settings.watch<number>('Livechat_max_queue_wait_time', (value) => {
	if (value <= 0) {
		callbacks.remove('livechat.afterInquiryQueued', 'livechat-inquiry-queued-set-queue-timer');
		return;
	}
	callbacks.add('livechat.afterInquiryQueued', withTimer(value), callbacks.priority.HIGH, 'livechat-inquiry-queued-set-queue-timer');
});
