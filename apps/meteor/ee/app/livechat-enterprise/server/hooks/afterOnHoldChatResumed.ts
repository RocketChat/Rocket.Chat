import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { cbLogger } from '../lib/logger';

const handleAfterOnHoldChatResumed = async (room: IOmnichannelRoom): Promise<void> => {
	if (!room?._id) {
		cbLogger.debug('Skipping callback. No room provided');
		return;
	}

	const { _id: roomId } = room;

	cbLogger.debug(`Removing current on hold timers for room ${roomId}`);
	await AutoCloseOnHoldScheduler.unscheduleRoom(roomId);
};

callbacks.add(
	'livechat:afterOnHoldChatResumed',
	(room: IOmnichannelRoom) => Promise.await(handleAfterOnHoldChatResumed(room)),
	callbacks.priority.HIGH,
	'livechat-after-on-hold-chat-resumed',
);
