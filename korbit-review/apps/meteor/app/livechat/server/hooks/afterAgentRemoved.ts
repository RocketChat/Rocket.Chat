import { LivechatDepartment, Users, LivechatDepartmentAgents, LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChanged, notifyOnUserChange } from '../../../lib/server/lib/notifyListener';

callbacks.add('livechat.afterAgentRemoved', async ({ agent }) => {
	const departments = await LivechatDepartmentAgents.findByAgentId(agent._id).toArray();

	const [{ modifiedCount }, { deletedCount }] = await Promise.all([
		Users.removeAgent(agent._id),
		LivechatDepartmentAgents.removeByAgentId(agent._id),
		agent.username && LivechatVisitors.removeContactManagerByUsername(agent.username),
		departments.length && LivechatDepartment.decreaseNumberOfAgentsByIds(departments.map(({ departmentId }) => departmentId)),
	]);

	if (modifiedCount > 0) {
		void notifyOnUserChange({
			id: agent._id,
			clientAction: 'updated',
			diff: {
				operator: false,
				livechat: null,
				statusLivechat: null,
				extension: null,
				openBusinessHours: null,
			},
		});
	}

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
