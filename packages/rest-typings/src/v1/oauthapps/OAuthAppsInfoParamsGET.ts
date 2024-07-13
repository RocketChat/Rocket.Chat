import { ajv } from '../Ajv';

export type OauthAppsInfoParams = { clientId: string };

const oauthAppsInfoParamsSchema = {
	type: 'object',
	properties: {
		clientId: {
			type: 'string',
		},
	},
	required: ['clientId'],
	additionalProperties: false,
};

export const isOauthAppsInfoParams = ajv.compile<OauthAppsInfoParams>(oauthAppsInfoParamsSchema);
