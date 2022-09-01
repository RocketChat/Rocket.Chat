import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		get() {
			check(this.urlParams, {
				agentId: String,
			});
			check(this.queryParams, {
				enabledDepartmentsOnly: Match.Maybe(String),
			});

			const departments = Promise.await(
				findAgentDepartments({
					userId: this.userId,
					enabledDepartmentsOnly: this.queryParams.enabledDepartmentsOnly && this.queryParams.enabledDepartmentsOnly === 'true',
					agentId: this.urlParams.agentId,
				}),
			);

			return API.v1.success(departments);
		},
	},
);
