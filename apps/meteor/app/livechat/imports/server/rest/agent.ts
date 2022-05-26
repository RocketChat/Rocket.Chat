import { check, Match } from 'meteor/check';

import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			const { agentId } = this.urlParams;
			const { enabledDepartmentsOnly } = this.queryParams;

			check(agentId, String);
			check(enabledDepartmentsOnly, Match.Optional(String));

			const departments = await findAgentDepartments({
				enabledDepartmentsOnly: enabledDepartmentsOnly === 'true',
				agentId,
			});

			return API.v1.success(departments);
		},
	},
);
