import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

settings.watch('Livechat_abandoned_rooms_action', (value) => {
	if (!value || value === 'none') {
		callbacks.remove('livechat:afterReturnRoomAsInquiry', 'livechat-after-return-room-as-inquiry');
		return;
	}
	callbacks.add(
		'livechat:afterReturnRoomAsInquiry',
		({ room }: { room: IOmnichannelRoom }) => {
			if (!room?._id || !room?.omnichannel?.predictedVisitorAbandonmentAt) {
				return;
			}

			return LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id);
		},
		callbacks.priority.HIGH,
		'livechat-after-return-room-as-inquiry',
	);
});
