import type { IWorkspaceInfo } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getServerInfo } from '../lib/getServerInfo';

const infoResponseSchema = ajv.compile<IWorkspaceInfo>({
	type: 'object',
	properties: {
		version: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

API.default.get(
	'info',
	{
		authRequired: false,
		response: {
			200: infoResponseSchema,
		},
	},
	async function action() {
		return API.v1.success(await getServerInfo(this.userId));
	},
);
