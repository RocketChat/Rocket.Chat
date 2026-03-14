import type { ISetting } from '@rocket.chat/core-typings';
import { ajv, validateForbiddenErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { findIntegrationSettings } from '../../../server/api/lib/integrations';

const livechatIntegrationsEndpoints = API.v1.get(
	'livechat/integrations.settings',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		query: undefined,
		response: {
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			200: ajv.compile<{ settings: ISetting[]; success: boolean }>({
				type: 'object',
				properties: {
					settings: {
						type: 'array',
						items: { $ref: '#/components/schemas/ISetting' },
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['settings', 'success'],
			}),
		},
	},
	async function action() {
		return API.v1.success(await findIntegrationSettings());
	},
);

type LivechatIntegrationsEndpoints = ExtractRoutesFromAPI<typeof livechatIntegrationsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatIntegrationsEndpoints { }
}
