import type { ISetting } from '@rocket.chat/core-typings';
import { ajv, validateForbiddenErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../..';
import { findIntegrationSettings } from './lib/integrations';

// TODO: `ISetting.value` is a `SettingValue` union (string | number | boolean | Date | string[] | ...).
// typia emits it as a `oneOf` whose Date (format: date-time) and string branches overlap, so real values
// fail AJV `oneOf` validation (same class as the documented `Date | string` pitfall). Until the setting
// schema's `value` is reworked (e.g. an ajv.ts patch collapsing the union), items stay unconstrained here.
const integrationSettingsResponseSchema = ajv.compile<{ settings: ISetting[] }>({
	type: 'object',
	properties: {
		settings: { type: 'array', items: { type: 'object' } },
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
