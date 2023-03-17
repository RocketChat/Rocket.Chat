import { isGETLivechatAgentsAgentIdDepartmentsParams } from '@rocket.chat/rest-typings';
import { Settings } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatAgentsAgentIdDepartmentsParams },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const departments = await findAgentDepartments({
				enabledDepartmentsOnly: this.queryParams.enabledDepartmentsOnly && this.queryParams.enabledDepartmentsOnly === 'true',
				agentId: this.urlParams.agentId,
			});

			return API.v1.success(departments);
		},
	},
);
