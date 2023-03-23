import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { callbackLogger } from '../../../../../app/livechat/server/lib/callbackLogger';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
};

const onCloseLivechat = async (params: LivechatCloseCallbackParams) => {
	const {
		room,
		room: { _id: roomId },
	} = params;

	callbackLogger.debug(`[onCloseLivechat] clearing onHold related data for room ${roomId}`);

	await Promise.all([
		LivechatRooms.unsetOnHoldByRoomId(roomId),
		Subscriptions.unsetOnHoldByRoomId(roomId),
		AutoCloseOnHoldScheduler.unscheduleRoom(roomId),
	]);

	callbackLogger.debug(`[onCloseLivechat] clearing onHold related data for room ${roomId} completed`);

	if (!settings.get('Livechat_waiting_queue')) {
		return params;
	}

	const { departmentId } = room || {};
	callbackLogger.debug(`[onCloseLivechat] dispatching waiting queue status for department ${departmentId}`);
	debouncedDispatchWaitingQueueStatus(departmentId);

	return params;
};

callbacks.add(
	'livechat.closeRoom',
	(params: LivechatCloseCallbackParams) => onCloseLivechat(params),
	callbacks.priority.HIGH,
	'livechat-waiting-queue-monitor-close-room',
);
