import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import moment from 'moment';

import { afterInquiryQueued } from '../../../../../app/livechat/server/lib/hooks';
import { settings } from '../../../../../app/settings/server';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';

export const afterInquiryQueuedFunc = async (inquiry: ILivechatInquiryRecord) => {
	const timer = settings.get<number>('Livechat_max_queue_wait_time');
	if (!inquiry?._id || !inquiry?._updatedAt || timer <= 0) {
		return void 0;
	}

	// schedule individual jobs instead of property for close inactivty
	const newQueueTime = moment(inquiry._updatedAt).add(timer, 'minutes');
	await OmnichannelQueueInactivityMonitor.scheduleInquiry(inquiry._id, new Date(newQueueTime.format()));
};

afterInquiryQueued.patch(async (originalFn: any, inquiry: ILivechatInquiryRecord) => {
	await originalFn();
	return afterInquiryQueuedFunc(inquiry);
});
