import { callbacks } from '../../../../../lib/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { cbLogger } from '../lib/logger';

const handleAfterOnHoldChatResumed = async (room: any): Promise<void> => {
	if (!room || !room._id || !room.onHold) {
		cbLogger.debug('Skipping callback. No room provided or room is not on hold');
		return;
	}

	cbLogger.debug(`Removing current on hold timers for room ${room._id}`);
	LivechatEnterprise.releaseOnHoldChat(room);
};

callbacks.add(
	'livechat:afterOnHoldChatResumed',
	handleAfterOnHoldChatResumed,
	callbacks.priority.HIGH,
	'livechat-after-on-hold-chat-resumed',
);
