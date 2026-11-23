import { ajv, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { listCameraBackgrounds } from '../../../server/lib/cameraBackgrounds';

const backgroundsResponseSchema = ajv.compile<{ backgrounds: { id: string; url: string }[] }>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		backgrounds: {
			type: 'array',
			items: {
				type: 'object',
				properties: { id: { type: 'string' }, url: { type: 'string' } },
				required: ['id', 'url'],
				additionalProperties: false,
			},
		},
	},
	required: ['success', 'backgrounds'],
	additionalProperties: false,
});

API.v1.get(
	'video-conference.backgrounds',
	{
		authRequired: true,
		response: {
			200: backgroundsResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({ backgrounds: await listCameraBackgrounds() });
	},
);
