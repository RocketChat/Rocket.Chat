import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByRoomId } from '../../../../../app/lib/server/lib/notifyListener';
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

	const responses = await Promise.all([
		LivechatRooms.unsetOnHoldByRoomId(roomId),
		Subscriptions.unsetOnHoldByRoomId(roomId),
		AutoCloseOnHoldScheduler.unscheduleRoom(roomId),
	]);

	if (responses[1].modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(roomId);
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
	'livechat-waiting-queue-monitor-close-room',
);
