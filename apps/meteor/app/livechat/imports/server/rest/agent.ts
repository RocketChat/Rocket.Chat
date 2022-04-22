import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true },
	{
		async get() {
			const { agentId } = this.urlParams;
			const { enabledDepartmentsOnly } = this.queryParams;

			const departments = await findAgentDepartments({
				userId: this.userId,
				enabledDepartmentsOnly: enabledDepartmentsOnly && enabledDepartmentsOnly === 'true',
				agentId,
			});

			return API.v1.success(departments);
		},
	},
);
