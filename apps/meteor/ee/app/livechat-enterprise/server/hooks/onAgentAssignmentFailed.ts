import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

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
	handleOnAgentAssignmentFailed,
	callbacks.priority.HIGH,
	'livechat-agent-assignment-failed',
);
