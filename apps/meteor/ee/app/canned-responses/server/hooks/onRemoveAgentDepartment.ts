import { CannedResponse } from '@rocket.chat/models';

import notifications from '../../../../../app/notifications/server/lib/Notifications';
import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.removeAgentDepartment',
	async (options: Record<string, any>): Promise<any> => {
		const { departmentId, agentsId } = options;
		await CannedResponse.findByDepartmentId(departmentId, { projection: { _id: 1 } }).forEach((response: any) => {
			const { _id } = response;
			notifications.streamCannedResponses.emit('canned-responses', { type: 'removed', _id }, { agentsId });
		});

		return options;
	},
	callbacks.priority.HIGH,
	'canned-responses-on-remove-agent-department',
);
