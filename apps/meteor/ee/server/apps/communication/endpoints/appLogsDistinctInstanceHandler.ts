import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import type { AppsRestApi } from '../rest';

export const registerAppLogsDistinctInstanceHandler = ({ api, _orch }: AppsRestApi) =>
	void api.get(
		'logs/instanceIds',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			response: {
				200: ajv.compile({
					type: 'object',
					properties: { instanceIds: { type: 'array', items: { type: 'string' } } },
					required: ['instanceIds'],
					additionalProperties: false,
				}),
			},
		},
		async () => {
			const result = await _orch.getLogStorage().distinctInstanceIds();

			return api.success({ instanceIds: result });
		},
	);
