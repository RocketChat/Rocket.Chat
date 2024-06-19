import { LivechatDepartment, Users, LivechatDepartmentAgents, LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChanged } from '../../../lib/server/lib/notifyListener';

callbacks.add('livechat.afterAgentRemoved', async ({ agent }) => {
	const departments = await LivechatDepartmentAgents.findByAgentId(agent._id).toArray();

	const [, { deletedCount }] = await Promise.all([
		Users.removeAgent(agent._id),
		LivechatDepartmentAgents.removeByAgentId(agent._id),
		agent.username && LivechatVisitors.removeContactManagerByUsername(agent.username),
		departments.length && LivechatDepartment.decreaseNumberOfAgentsByIds(departments.map(({ departmentId }) => departmentId)),
	]);

	if (deletedCount > 0) {
		departments.forEach((depAgent) => {
			void notifyOnLivechatDepartmentAgentChanged(
				{
					_id: depAgent._id,
					agentId: agent._id,
					departmentId: depAgent.departmentId,
				},
				'removed',
			);
		});
	}
});
