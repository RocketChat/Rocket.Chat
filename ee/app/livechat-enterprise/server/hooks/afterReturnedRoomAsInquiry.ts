import { callbacks } from '../../../../../app/callbacks/server';

const handleAfterReturnedRoomAsInquiry = async (room: any): Promise<void> => {
	if (!room) {
		return;
	}
	await callbacks.run('livechat:afterOnHoldChatResumed', room);
};

callbacks.add('livechat:afterReturnedRoomAsInquiry', handleAfterReturnedRoomAsInquiry, callbacks.priority.HIGH, 'livechat-after-return-room-as-inquiry');
