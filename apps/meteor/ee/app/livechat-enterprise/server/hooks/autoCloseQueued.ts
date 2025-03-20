import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';

settings.watch('Livechat_max_queue_wait_time', (value: number) => {
	if (!value || value < 0) {
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-after-inquiry-taken-remove-schedule');
		return;
	}
	callbacks.add(
		'livechat.afterTakeInquiry',
		async ({ inquiry }): Promise<void> => {
			if (!inquiry?._id) {
				return;
			}
			await OmnichannelQueueInactivityMonitor.stopInquiry(inquiry._id);
		},
		callbacks.priority.HIGH,
		'livechat-after-inquiry-taken-remove-schedule',
	);
});
