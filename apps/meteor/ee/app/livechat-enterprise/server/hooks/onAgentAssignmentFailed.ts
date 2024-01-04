import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

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

	return { ...room, chatQueued: true } as IOmnichannelRoom & { chatQueued: boolean };
};

callbacks.add(
	'livechat.onAgentAssignmentFailed',
	handleOnAgentAssignmentFailed,
	callbacks.priority.HIGH,
	'livechat-agent-assignment-failed',
);
