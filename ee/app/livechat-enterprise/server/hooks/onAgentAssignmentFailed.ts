import { callbacks } from '../../../../../app/callbacks/server';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { settings } from '../../../../../app/settings/server';

const handleOnAgentAssignmentFailed = async ({ inquiry, room, options }: { inquiry: any; room: any; options: { forwardingToDepartment?: { oldDepartmentId: string; transferData: any }; clientAction?: boolean} }): Promise<any> => {
	if (!inquiry || !room) {
		return;
	}

	if (room.onHold) {
		const { _id: roomId } = room;

		const { _id: inquiryId } = inquiry;
		LivechatInquiry.readyInquiry(inquiryId);
		LivechatInquiry.removeDefaultAgentById(inquiryId);
		LivechatRooms.removeAgentByRoomId(roomId);
		Subscriptions.removeByRoomId(roomId);
		const newInquiry = LivechatInquiry.findOneById(inquiryId);

		await queueInquiry(room, newInquiry);

		return;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return;
	}

	const { forwardingToDepartment: { oldDepartmentId } = {}, forwardingToDepartment } = options;
	if (!forwardingToDepartment) {
		return;
	}

	const { department: newDepartmentId } = inquiry;

	if (!newDepartmentId || !oldDepartmentId || newDepartmentId === oldDepartmentId) {
		return;
	}

	room.chatQueued = true;
	return room;
};

callbacks.add('livechat.onAgentAssignmentFailed', handleOnAgentAssignmentFailed, callbacks.priority.HIGH, 'livechat-agent-assignment-failed');
