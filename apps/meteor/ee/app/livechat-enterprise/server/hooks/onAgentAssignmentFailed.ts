import { callbacks } from '../../../../../lib/callbacks';
import { LivechatInquiry, Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';
import { dispatchAgentDelegated } from '../../../../../app/livechat/server/lib/Helper';

const handleOnAgentAssignmentFailed = async ({
	inquiry,
	room,
	options,
}: {
	inquiry: any;
	room: any;
	options: {
		forwardingToDepartment?: { oldDepartmentId: string; transferData: any };
		clientAction?: boolean;
	};
}): Promise<any> => {
	if (!inquiry || !room) {
		cbLogger.debug('Skipping callback. No inquiry or room provided');
		return;
	}

	if (room.onHold) {
		cbLogger.debug('Room is on hold. Removing current assignations before queueing again');
		const { _id: roomId } = room;

		const { _id: inquiryId } = inquiry;
		LivechatInquiry.queueInquiryAndRemoveDefaultAgent(inquiryId);
		LivechatRooms.removeAgentByRoomId(roomId);
		Subscriptions.removeByRoomId(roomId);
		dispatchAgentDelegated(roomId, null);

		const newInquiry = LivechatInquiry.findOneById(inquiryId);

		await queueInquiry(room, newInquiry);

		cbLogger.debug('Room queued successfully');
		return;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		cbLogger.debug('Skipping callback. Queue disabled by setting');
		return;
	}

	const { forwardingToDepartment: { oldDepartmentId } = {}, forwardingToDepartment } = options;
	if (!forwardingToDepartment) {
		cbLogger.debug('Skipping callback. Room not being forwarded to department');
		return;
	}

	const { department: newDepartmentId } = inquiry;

	if (!newDepartmentId || !oldDepartmentId || newDepartmentId === oldDepartmentId) {
		cbLogger.debug('Skipping callback. New and old departments are the same');
		return;
	}

	room.chatQueued = true;
	return room;
};

callbacks.add(
	'livechat.onAgentAssignmentFailed',
	({ inquiry, room, options }) => Promise.await(handleOnAgentAssignmentFailed({ inquiry, room, options })),
	callbacks.priority.HIGH,
	'livechat-agent-assignment-failed',
);
