import moment from 'moment';

import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, LivechatRooms } from '../../../../../app/models/server';
import { settings } from '../../../../../app/settings/server';

const unsetPredictedVisitorAbandonment = ({ room }: { room: any }): void => {
	if (!room?._id || !room?.omnichannel?.predictedVisitorAbandonmentAt) {
		return;
	}

	(LivechatRooms as any).unsetPredictedVisitorAbandonmentByRoomId(room._id);
};

const setQueueTimer = (timeToAdd: any) => ({ room }: { room: any }): void => {
	if (!room?._id || room?.t !== 'l') {
		return;
	}

	const inquiry = (LivechatInquiry as any).findOneByRoomId(room?._id);
	if (!inquiry) {
		return;
	}

	const newQueueTime = moment(inquiry?._updatedAt).add(timeToAdd, 'minutes');
	(LivechatInquiry as any).setEstimatedInactivityCloseTime(inquiry?._id, newQueueTime);
};

settings.get('Livechat_abandoned_rooms_action', (_, value) => {
	if (!value || value === 'none') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry');
		return;
	}
	callbacks.add('livechat:afterReturnRoomAsInquiry', unsetPredictedVisitorAbandonment, callbacks.priority.HIGH, 'livechat-after-return-room-as-inquiry');
});

settings.get('Livechat_max_queue_wait_time_action', (_, value) => {
	if (!value || value === 'Nothing') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry-set-queue-timer');
		return;
	}
	const timer = settings.get('Livechat_max_queue_wait_time');
	callbacks.add('livechat:afterReturnRoomAsInquiry', setQueueTimer(timer), callbacks.priority.HIGH, 'livechat-after-return-room-as-inquiry-set-queue-timer');
});
