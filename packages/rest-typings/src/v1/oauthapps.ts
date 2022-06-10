import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type OauthAppsGetParams = { clientId: string } | { appId: string };

export type OAuthAppsEndpoint = {
	'/v1/oauth-apps.list': {
		GET: (params: { uid: IUser['_id'] }) => {
			oauthApps: IOAuthApps[];
		};
	};

	'/v1/oauth-apps.get': {
		GET: (params: OauthAppsGetParams) => {
			oauthApp: IOAuthApps;
		};
	};
};

const oauthAppsGetParamsSchema = {
	oneOf: [
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
