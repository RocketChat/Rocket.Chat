import type { ISetting } from '@rocket.chat/core-typings';
import { ajv, validateForbiddenErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../..';
import { findIntegrationSettings } from './lib/integrations';

const integrationSettingsResponseSchema = ajv.compile<{ settings: ISetting[] }>({
	type: 'object',
	properties: {
		settings: { type: 'array', items: { $ref: '#/components/schemas/ISettingBase' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['settings', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'livechat/integrations.settings',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		response: {
			200: integrationSettingsResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		return API.v1.success(await findIntegrationSettings());
	},
);
