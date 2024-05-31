import { LivechatDepartment, Users, LivechatDepartmentAgents, LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChangedByAgentId } from '../../../lib/server/lib/notifyListener';

callbacks.add('livechat.afterAgentRemoved', async ({ agent }) => {
	const departmentIds = (await LivechatDepartmentAgents.findByAgentId(agent._id).toArray()).map((department) => department.departmentId);

	await Promise.all([
		Users.removeAgent(agent._id),
		LivechatDepartmentAgents.removeByAgentId(agent._id),
		agent.username && LivechatVisitors.removeContactManagerByUsername(agent.username),
		departmentIds.length && LivechatDepartment.decreaseNumberOfAgentsByIds(departmentIds),
	]);

	void notifyOnLivechatDepartmentAgentChangedByAgentId(agent._id);
});
