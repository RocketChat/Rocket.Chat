import { Presence } from '@rocket.chat/core-services';
import { ajv, validateUnauthorizedErrorResponse, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.get(
	'presence.getConnections',
	{
		authRequired: true,
		permissionsRequired: ['manage-user-status'],
		response: {
			200: ajv.compile<{ current: number; max: number; success: true }>({
				type: 'object',
				properties: {
					current: { type: 'number' },
					max: { type: 'number' },
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['current', 'max', 'success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const result = await Presence.getConnectionCount();

		return API.v1.success(result);
	},
);

API.v1.post(
	'presence.enableBroadcast',
	{
		authRequired: true,
		permissionsRequired: ['manage-user-status'],
		twoFactorRequired: true,
		response: {
			200: ajv.compile<{ success: true }>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		await Presence.toggleBroadcast(true);

		return API.v1.success({});
	},
);
