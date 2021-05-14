import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';

const handleOnAgentAssignmentFailed = async ({ inquiry, room, options }: { inquiry: any; room: any; options: { forwardRoomOldDepartment?: string; clienAction?: boolean} }): Promise<any> => {
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

	const { forwardRoomOldDepartment: oldDepartmentId } = options;
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
};

callbacks.add('livechat.onAgentAssignmentFailed', handleOnAgentAssignmentFailed, callbacks.priority.HIGH, 'livechat-agent-assignment-failed');
