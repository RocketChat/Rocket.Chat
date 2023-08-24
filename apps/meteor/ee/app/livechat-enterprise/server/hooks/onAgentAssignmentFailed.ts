import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

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

	return { ...room, chatQueued: true } as IOmnichannelRoom & { chatQueued: boolean };
};

callbacks.add(
	'livechat.onAgentAssignmentFailed',
	handleOnAgentAssignmentFailed,
	callbacks.priority.HIGH,
	'livechat-agent-assignment-failed',
);
