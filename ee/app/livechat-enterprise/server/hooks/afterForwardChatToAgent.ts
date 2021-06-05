import { callbacks } from '../../../../../app/callbacks/server';
import LivechatRooms from '../../../../../app/models/server/models/LivechatRooms';

callbacks.add('livechat.afterForwardChatToAgent', (options: { rid?: string } = {}) => {
	const { rid } = options;

	const room = LivechatRooms.findOneById(rid);
	if (!room) {
		return options;
	}

	(LivechatRooms as any).unsetPredictedVisitorAbandonmentByRoomId(rid);

	return options;
}, callbacks.priority.MEDIUM, 'livechat-after-forward-room-to-department');
