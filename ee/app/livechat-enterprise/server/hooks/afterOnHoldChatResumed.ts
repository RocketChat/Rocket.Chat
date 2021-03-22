import { callbacks } from '../../../../../app/callbacks/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { LivechatRooms, Subscriptions } from '../../../../../app/models/server';

const handleAfterOnHoldChatResumed = async (room: any): Promise<void> => {
	if (!room || !room._id || !room.onHold) {
		return;
	}

	await AutoCloseOnHoldScheduler.unscheduleRoom(room._id);
	(LivechatRooms as any).unsetAllOnHoldFieldsByRoomId(room._id);
	Subscriptions.unsetOnHold(room._id);
};

callbacks.add('livechat:afterOnHoldChatResumed', handleAfterOnHoldChatResumed, callbacks.priority.HIGH, 'livechat-after-on-hold-chat-resumed');
