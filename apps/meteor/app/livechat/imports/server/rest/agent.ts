import { isGETLivechatAgentsAgentIdDepartmentsParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatAgentsAgentIdDepartmentsParams },
	{
		async get() {
			const departments = await findAgentDepartments({
				enabledDepartmentsOnly: this.queryParams.enabledDepartmentsOnly && this.queryParams.enabledDepartmentsOnly === 'true',
				agentId: this.urlParams.agentId,
			});

			return API.v1.success(departments);
		},
	},
);
