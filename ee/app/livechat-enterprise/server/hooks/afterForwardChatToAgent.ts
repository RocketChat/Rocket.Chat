import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatRooms } from '../../../../../app/models/server';

const handleAfterForwardChatToAgent = async ({ rid = null }: { rid: any }): Promise<void> => {
	if (!rid) {
		return;
	}

	const room = LivechatRooms.findOneById(rid);
	if (!room) {
		return;
	}

	await callbacks.run('livechat:afterOnHoldChatResumed', room);
};

callbacks.add('livechat.afterForwardChatToAgent', handleAfterForwardChatToAgent, callbacks.priority.HIGH, 'livechat-after-forward-chat-to-agent');
