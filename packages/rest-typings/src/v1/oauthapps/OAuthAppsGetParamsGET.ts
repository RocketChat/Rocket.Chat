import { ajv } from '../../helpers/schemas';

export type OauthAppsGetParams = { clientId: string } | { appId: string } | { _id: string };

const oauthAppsGetParamsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				_id: {
					type: 'string',
				},
			},
			required: ['_id'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				clientId: {
					type: 'string',
				},
			},
			required: ['clientId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				appId: {
					type: 'string',
				},
			},
			required: ['appId'],
			additionalProperties: false,
		},
	],
};

export const isOauthAppsGetParams = ajv.compile<OauthAppsGetParams>(oauthAppsGetParamsSchema);
