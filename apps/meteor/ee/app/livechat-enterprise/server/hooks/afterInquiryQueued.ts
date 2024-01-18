import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { LivechatInquiry } from '@rocket.chat/models';
import moment from 'moment';

import { getInquirySortMechanismSetting } from '../../../../../app/livechat/server/lib/settings';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { dispatchInquiryPosition } from '../lib/Helper';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';
import { cbLogger } from '../lib/logger';

const afterQueueInquiry = async (inquiry: ILivechatInquiryRecord): Promise<void> => {
	if (settings.get<number>('Livechat_max_queue_wait_time') > 0) {
		if (!inquiry?._id) {
			return;
		}

		if (!inquiry?._updatedAt || !inquiry?._createdAt) {
			return;
		}

		// schedule individual jobs instead of property for close inactivty
		const newQueueTime = moment(inquiry._updatedAt || inquiry._createdAt).add(
			settings.get<number>('Livechat_max_queue_wait_time'),
			'minutes',
		);
		cbLogger.debug(`Scheduling estimated close time at ${newQueueTime} for queued inquiry ${inquiry._id}`);
		await OmnichannelQueueInactivityMonitor.scheduleInquiry(inquiry._id, new Date(newQueueTime.format()));
	}

	if (settings.get('Livechat_waiting_queue') && settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
		const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({
			inquiryId: inquiry._id,
			department: inquiry.department,
			queueSortBy: getInquirySortMechanismSetting(),
		});
		if (inq) {
			await dispatchInquiryPosition(inq);
		}
	}
};

callbacks.add('livechat.afterInquiryQueued', afterQueueInquiry, callbacks.priority.HIGH, 'livechat-inquiry-queued-set-queue-timer');
