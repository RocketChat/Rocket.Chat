import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import {
	ajv,
	isGETLivechatAgentsAgentIdDepartmentsParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../..';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { findAgentDepartments } from './lib/agents';

const agentDepartmentsResponseSchema = ajv.compile<{
	departments: (ILivechatDepartmentAgents & { departmentName: string })[];
	success: true;
}>({
	type: 'object',
	properties: {
		departments: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					_updatedAt: { type: ['string', 'object'] },
					departmentId: { type: 'string' },
					departmentEnabled: { type: 'boolean' },
					agentId: { type: 'string' },
					username: { type: 'string' },
					count: { type: 'number' },
					order: { type: 'number' },
					departmentName: { type: 'string' },
				},
				required: ['_id', '_updatedAt', 'departmentId', 'departmentEnabled', 'agentId', 'username', 'count', 'order', 'departmentName'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['departments', 'success'],
	additionalProperties: false,
});

const livechatAgentDepartmentsEndpoints = API.v1.get(
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
			enabledDepartmentsOnly: this.queryParams.enabledDepartmentsOnly === 'true',
			agentId: this.urlParams.agentId,
		});

		return API.v1.success(departments);
	},
);

type LivechatAgentDepartmentsEndpoints = ExtractRoutesFromAPI<typeof livechatAgentDepartmentsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatAgentDepartmentsEndpoints {}
}
