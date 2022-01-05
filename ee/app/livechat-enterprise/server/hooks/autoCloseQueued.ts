import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';

const removeScheduledQueueCloseTime = (inquiry: any): void => {
	if (!inquiry?._id) {
		return;
	}
	OmnichannelQueueInactivityMonitor.stopInquiry(inquiry._id);
};

settings.watch('Livechat_max_queue_wait_time', function (value: number) {
	if (!value || value < 0) {
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-after-inquiry-taken-remove-schedule');
		return;
	}
	callbacks.add(
		'livechat.afterTakeInquiry',
		removeScheduledQueueCloseTime,
		callbacks.priority.HIGH,
		'livechat-after-inquiry-taken-remove-schedule',
	);
});
