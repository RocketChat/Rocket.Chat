import { callbacks } from '../../../../../app/callbacks/server';
import CannedResponse from '../../../models/server/models/CannedResponse';
import { cannedResponsesStreamer } from '../streamer';

callbacks.add('livechat.removeAgentDepartment', async (options: Record<string, any>): Promise<any> => {
	const { departmentId, agentsId } = options;
	CannedResponse.findByDepartmentId(departmentId, { fields: { _id: 1 } }).forEach((response: any) => {
		const { _id } = response;
		cannedResponsesStreamer.emit('canned-responses', { type: 'removed', _id }, { agentsId });
	});

	return options;
}, callbacks.priority.HIGH, 'canned-responses-on-remove-agent-department');
