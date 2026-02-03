import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../server/lib/callbacks';

const handleOnAgentAssignmentFailed = async (
	room: IOmnichannelRoom,
	{
		inquiry,
		options,
	}: {
		inquiry: any;
		options: {
			forwardingToDepartment?: { oldDepartmentId?: string; transferData?: any };
			clientAction?: boolean;
		};
	},
) => {
	if (!inquiry || !room) {
		return false;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return false;
	}

	const { forwardingToDepartment: { oldDepartmentId } = {}, forwardingToDepartment } = options;
	if (!forwardingToDepartment) {
		return false;
	}

	const { department: newDepartmentId } = inquiry;

	if (!newDepartmentId || !oldDepartmentId || newDepartmentId === oldDepartmentId) {
		return false;
	}

	return { ...room, chatQueued: true } as IOmnichannelRoom & { chatQueued: boolean };
};

callbacks.add(
	'livechat.onAgentAssignmentFailed',
	handleOnAgentAssignmentFailed,
	callbacks.priority.HIGH,
	'livechat-agent-assignment-failed',
);
