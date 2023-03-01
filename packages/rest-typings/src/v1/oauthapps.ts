import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type OauthAppsGetParams = { clientId: string } | { appId: string };

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

export type OauthAppsAddParams = {
	name: string;
	active: boolean;
	redirectUri: string;
};

const OauthAppsAddParamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		active: {
			type: 'boolean',
		},
		redirectUri: {
			type: 'string',
		},
	},
	required: ['name', 'active', 'redirectUri'],
	additionalProperties: false,
};

export const isOauthAppsAddParams = ajv.compile<OauthAppsAddParams>(OauthAppsAddParamsSchema);

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

	'/v1/oauth-apps.create': {
		POST: (params: OauthAppsAddParams) => { application: IOAuthApps };
	};
};
