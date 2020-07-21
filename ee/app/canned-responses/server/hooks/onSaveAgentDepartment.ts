import { callbacks } from '../../../../../app/callbacks/server';
import CannedResponse from '../../../models/server/models/CannedResponse';
import { cannedResponsesStreamer } from '../streamer';

callbacks.add('livechat.saveAgentDepartment', async (options: Record<string, any>): Promise<any> => {
	const { departmentId, agentsId } = options;
	CannedResponse.findByDepartmentId(departmentId, {}).forEach((response: any) => {
		cannedResponsesStreamer.emit('canned-responses', { type: 'changed', ...response }, { agentsId });
	});

	return options;
}, callbacks.priority.HIGH, 'canned-responses-on-save-agent-department');
