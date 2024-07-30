import { ajv } from '../Ajv';

export type OauthAppsInfoParams = { clientId: string };

const oauthAppsInfoParamsSchema = {
	type: 'object',
	properties: {
		clientId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['clientId'],
	additionalProperties: false,
};

export const isOauthAppsInfoParams = ajv.compile<OauthAppsInfoParams>(oauthAppsInfoParamsSchema);
