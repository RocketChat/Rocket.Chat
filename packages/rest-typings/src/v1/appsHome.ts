import type { HomeView } from '@rocket.chat/ui-kit';

import { ajv } from './Ajv';

type AppsHomeOpenProps = {
	appId: string;
};

const appsHomeOpenPropsSchema = {
	type: 'object',
	properties: {
		appId: {
			type: 'string',
			minLength: 1,
			description: 'The id of the app whose home is opened',
			example: 'a1b2c3d4-0000-4000-8000-000000000000',
		},
	},
	required: ['appId'],
	additionalProperties: false,
};

export const isAppsHomeOpenProps = ajv.compile<AppsHomeOpenProps>(appsHomeOpenPropsSchema);

const appsHomeOpenSuccessResponseSchema = {
	type: 'object',
	properties: {
		view: {
			type: 'object',
			description: 'The home the app last published for the user; absent until the app publishes one',
			properties: {
				appId: { type: 'string' },
				id: { type: 'string' },
				blocks: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' } }, required: ['type'] } },
				private_metadata: { type: 'string' },
				external_id: { type: 'string' },
			},
			required: ['appId', 'id', 'blocks'],
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
};

export const validateAppsHomeOpenSuccessResponse = ajv.compile<{ view?: HomeView }>(appsHomeOpenSuccessResponseSchema);
