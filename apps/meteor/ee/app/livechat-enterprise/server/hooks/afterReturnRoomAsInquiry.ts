import { callbacks } from '../../../../../lib/callbacks';
import { LivechatRooms } from '../../../../../app/models/server';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

const unsetPredictedVisitorAbandonment = ({ room }: { room: any }): void => {
	if (!room?._id || !room?.omnichannel?.predictedVisitorAbandonmentAt) {
		cbLogger.debug('Skipping callback. No room or no visitor abandonment info');
		return;
	}

	(LivechatRooms as any).unsetPredictedVisitorAbandonmentByRoomId(room._id);
};

settings.watch('Livechat_abandoned_rooms_action', (value) => {
	if (!value || value === 'none') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry');
		return;
	}
	callbacks.add(
		'livechat:afterReturnRoomAsInquiry',
		unsetPredictedVisitorAbandonment,
		callbacks.priority.HIGH,
		'livechat-after-return-room-as-inquiry',
	);
});
