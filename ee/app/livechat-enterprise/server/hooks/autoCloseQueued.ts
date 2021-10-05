import { callbacks } from '../../../../../app/callbacks/server';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';

const removeScheduledQueueCloseTime = (inquiry: any): void => {
	if (!inquiry?._id) {
		return;
	}
	OmnichannelQueueInactivityMonitor.stopInquiry(inquiry._id);
};

callbacks.add('livechat.afterTakeInquiry', removeScheduledQueueCloseTime, callbacks.priority.HIGH, 'livechat-after-inquiry-taken-remove-schedule');
