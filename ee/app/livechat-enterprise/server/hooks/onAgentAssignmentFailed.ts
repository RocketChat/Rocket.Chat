import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';

const handleOnAgentAssignmentFailed = async ({ inquiry, room, options }: { inquiry: any; room: any; options: { forwardingToDepartment?: { oldDepartmentId: string; transferData: any }; clientAction?: boolean} }): Promise<any> => {
	if (!inquiry || !room) {
		return;
	}

	if (room.onHold) {
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

		return;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return;
	}

	const { forwardingToDepartment: { oldDepartmentId, transferData } = {}, forwardingToDepartment } = options;
	if (!forwardingToDepartment) {
		return;
	}

	const { department: newDepartmentId } = inquiry;

	if (!newDepartmentId || !oldDepartmentId || newDepartmentId === oldDepartmentId) {
		return;
	}

	// Undo the FAKE Department we did before RoutingManager.delegateInquiry()
	inquiry.department = oldDepartmentId;
	RoutingManager.unassignAgent(inquiry, newDepartmentId);

	LivechatInquiry.readyInquiry(inquiry._id);

	const newInquiry = LivechatInquiry.findOneById(inquiry._id);

	await queueInquiry(room, newInquiry);

	Livechat.saveTransferHistory(room, transferData);
};

callbacks.add('livechat.onAgentAssignmentFailed', handleOnAgentAssignmentFailed, callbacks.priority.HIGH, 'livechat-agent-assignment-failed');
