import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatRooms } from '../../../../../app/models/server';
import { SettingsVersion4 } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

const unsetPredictedVisitorAbandonment = ({ room }: { room: any }): void => {
	if (!room?._id || !room?.omnichannel?.predictedVisitorAbandonmentAt) {
		cbLogger.debug('Skipping callback. No room or no visitor abandonment info');
		return;
	}

	(LivechatRooms as any).unsetPredictedVisitorAbandonmentByRoomId(room._id);
};

SettingsVersion4.watch('Livechat_abandoned_rooms_action', (value) => {
	if (!value || value === 'none') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry');
		return;
	}
	callbacks.add('livechat:afterReturnRoomAsInquiry', unsetPredictedVisitorAbandonment, callbacks.priority.HIGH, 'livechat-after-return-room-as-inquiry');
});
