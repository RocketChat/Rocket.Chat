import moment from 'moment';

import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry } from '../../../../../app/models/server';
import { settings } from '../../../../../app/settings/server';
import { logger } from '../lib/logger';

let timer = 0;

const setQueueTimer = (inquiry: any): void => {
	if (!inquiry?._id) {
		(logger as any).cb.debug('Skipping callback. No inquiry provided');
		return;
	}

	const newQueueTime = moment(inquiry?._updatedAt).add(timer, 'minutes');
	(logger as any).cb.debug(`Setting estimated inactivity close time to ${ newQueueTime } for inquiry ${ inquiry._id }`);
	(LivechatInquiry as any).setEstimatedInactivityCloseTime(inquiry?._id, newQueueTime);
};

settings.get('Livechat_max_queue_wait_time', (_, value) => {
	timer = value as number;
});

settings.get('Livechat_max_queue_wait_time_action', (_, value) => {
	if (!value || value === 'Nothing') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry-set-queue-timer');
		return;
	}
	callbacks.add('livechat.afterInquiryQueued', setQueueTimer, callbacks.priority.HIGH, 'livechat-inquiry-queued-set-queue-timer');
});
