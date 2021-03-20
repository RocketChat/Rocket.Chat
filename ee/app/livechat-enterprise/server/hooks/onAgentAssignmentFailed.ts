import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';

const handleOnAgentAssignmentFailed = async ({ inquiry, room }: { inquiry: any; room: any }): Promise<any> => {
	if (!inquiry || !room) {
		return;
	}

	const { onHold, _id: roomId, servedBy } = room;
	if (!onHold) {
		return;
	}

	const defaultAgent = { agentId: servedBy._id, username: servedBy._id };

	const { _id: inquiryId } = inquiry;
	LivechatInquiry.readyInquiry(inquiryId);
	LivechatInquiry.removeDefaultAgentById(inquiryId);
	LivechatRooms.removeAgentByRoomId(roomId);
	if (defaultAgent.agentId) {
		Subscriptions.removeByRoomIdAndUserId(roomId, defaultAgent.agentId);
	}

	const newInquiry = LivechatInquiry.findOneById(inquiryId);

	await queueInquiry(room, newInquiry, defaultAgent);
};

callbacks.add('livechat.onAgentAssignmentFailed', handleOnAgentAssignmentFailed, callbacks.priority.HIGH, 'livechat-agent-assignment-failed');
