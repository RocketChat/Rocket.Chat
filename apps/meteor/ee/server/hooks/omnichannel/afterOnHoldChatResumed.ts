import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../server/lib/callbacks';
import { AutoCloseOnHoldScheduler } from '../../../app/livechat-enterprise/server/lib/AutoCloseOnHoldScheduler';
import { cbLogger } from '../../../app/livechat-enterprise/server/lib/logger';

type IRoom = Pick<IOmnichannelRoom, '_id'>;

const handleAfterOnHoldChatResumed = async (room: IRoom): Promise<IRoom> => {
	if (!room?._id) {
		return room;
	}

	const { _id: roomId } = room;

	cbLogger.debug({ msg: 'Removing current on hold timers for room', roomId });
	await AutoCloseOnHoldScheduler.unscheduleRoom(roomId);

	return room;
};

callbacks.add(
	'livechat:afterOnHoldChatResumed',
	handleAfterOnHoldChatResumed,
	callbacks.priority.HIGH,
	'livechat-after-on-hold-chat-resumed',
);
