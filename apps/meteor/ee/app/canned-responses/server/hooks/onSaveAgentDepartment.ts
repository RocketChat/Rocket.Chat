import { CannedResponse } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

callbacks.add(
	'livechat.saveAgentDepartment',
	async (options: Record<string, any>): Promise<any> => {
		const { departmentId, agentsId } = options;
		await CannedResponse.findByDepartmentId(departmentId, {}).forEach((response: any) => {
			notifications.streamCannedResponses.emit('canned-responses', { type: 'changed', ...response }, { agentsId });
		});

		return options;
	},
	callbacks.priority.HIGH,
	'canned-responses-on-save-agent-department',
);
