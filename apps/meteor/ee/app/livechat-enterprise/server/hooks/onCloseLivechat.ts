import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
};

const onCloseLivechat = async (params: LivechatCloseCallbackParams) => {
	const {
		room,
		room: { _id: roomId },
	} = params;

	await LivechatRooms.unsetOnHoldByRoomId(roomId);
	if (settings.get('Livechat_auto_close_on_hold_chats_timeout')) {
		await AutoCloseOnHoldScheduler.unscheduleRoom(roomId);
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return params;
	}

	const { departmentId } = room || {};
	debouncedDispatchWaitingQueueStatus(departmentId);

	return params;
};

callbacks.add(
	'livechat.closeRoom',
	(params: LivechatCloseCallbackParams) => onCloseLivechat(params),
	callbacks.priority.HIGH,
	'livechat-on-close-livechat-remove-on-hold-and-dispatch-waiting-queue',
);
