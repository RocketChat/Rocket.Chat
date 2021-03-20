import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';

const handleOnAgentAssignmentFailed = async ({ inquiry, room }: { inquiry: any; room: any }): Promise<any> => {
	if (!inquiry || !room || !room.onHold) {
		return;
	}

	const { _id: roomId, servedBy } = room;

	const { _id: inquiryId } = inquiry;
	LivechatInquiry.readyInquiry(inquiryId);
	LivechatInquiry.removeDefaultAgentById(inquiryId);
	LivechatRooms.removeAgentByRoomId(roomId);
	if (servedBy?._id) {
		Subscriptions.removeByRoomIdAndUserId(roomId, servedBy._id);
	}

	const newInquiry = LivechatInquiry.findOneById(inquiryId);

	await queueInquiry(room, newInquiry);
};

callbacks.add('livechat.onAgentAssignmentFailed', handleOnAgentAssignmentFailed, callbacks.priority.HIGH, 'livechat-agent-assignment-failed');
