import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import {
	ajv,
	isGETLivechatAgentsAgentIdDepartmentsParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../..';
import { findAgentDepartments } from './lib/agents';

const agentDepartmentsResponseSchema = ajv.compile<{ departments: (ILivechatDepartmentAgents & { departmentName: string })[] }>({
	type: 'object',
	properties: {
		departments: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['departments', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'livechat/agents/:agentId/departments',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		query: isGETLivechatAgentsAgentIdDepartmentsParams,
		response: {
			200: agentDepartmentsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const departments = await findAgentDepartments({
			enabledDepartmentsOnly: this.queryParams.enabledDepartmentsOnly && this.queryParams.enabledDepartmentsOnly === 'true',
			agentId: this.urlParams.agentId,
		});

		return API.v1.success(departments);
	},
);
