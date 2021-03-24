import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

const handleAfterOnHoldChatResumed = async (room: any): Promise<void> => {
	if (!room || !room._id || !room.onHold) {
		return;
	}

	LivechatEnterprise.releaseOnHoldChat(room);
};

callbacks.add('livechat:afterOnHoldChatResumed', handleAfterOnHoldChatResumed, callbacks.priority.HIGH, 'livechat-after-on-hold-chat-resumed');
