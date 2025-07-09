import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import type { AppsRestApi } from '../rest';

// This might be a good candidate for a default validator function exported by @rocket.chat/rest-typings
const errorResponse = ajv.compile({
	additionalProperties: false,
	type: 'object',
	properties: {
		error: {
			type: 'string',
		},
		status: {
			type: 'string',
			nullable: true,
		},
		message: {
			type: 'string',
			nullable: true,
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'error'],
});

export const registerAppLogsDistinctInstanceHandler = ({ api, _orch }: AppsRestApi) =>
	void api.get(
		':id/logs/instanceIds',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						instanceIds: { type: 'array', items: { type: 'string' } },
						methods: { type: 'array', items: { type: 'string' } },
						success: { type: 'boolean' },
					},
					required: ['instanceIds', 'methods', 'success'],
					additionalProperties: false,
				}),
				401: errorResponse,
				403: errorResponse,
			},
		},
		async function action() {
			const result = await _orch.getLogStorage().distinctValues(this.urlParams.id);

			return api.success(result);
		},
	);
