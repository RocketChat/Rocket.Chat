import type { IOAuthApps } from '@rocket.chat/core-typings';
import { OAuthApps } from '@rocket.chat/models';
import {
	ajv,
	isUpdateOAuthAppParams,
	isOauthAppsGetParams,
	isDeleteOAuthAppParams,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/functions/addOAuthApp';
import { deleteOAuthApp } from '../../../oauth2-server-config/server/admin/methods/deleteOAuthApp';
import { updateOAuthApp } from '../../../oauth2-server-config/server/admin/methods/updateOAuthApp';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const oauthAppsListEndpoints = API.v1.get(
	'oauth-apps.list',
	{
		authRequired: true,
		query: ajv.compile<{ uid?: string }>({
			type: 'object',
			properties: {
				uid: {
					type: 'string',
				},
			},
			additionalProperties: false,
		}),
		permissionsRequired: ['manage-oauth-apps'],
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			200: ajv.compile<{ oauthApps: IOAuthApps[] }>({
				type: 'object',
				properties: {
					oauthApps: {
						type: 'array',
						items: {
							$ref: '#/components/schemas/IOAuthApps',
						},
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['oauthApps', 'success'],
				additionalProperties: false,
			}),
		},
	},

	async function action() {
		return API.v1.success({
			oauthApps: await OAuthApps.find().toArray(),
		});
	},
);

API.v1.addRoute(
	'oauth-apps.get',
	{ authRequired: true, validateParams: isOauthAppsGetParams },
	{
		async get() {
			const isOAuthAppsManager = await hasPermissionAsync(this.userId, 'manage-oauth-apps');

			const oauthApp = await OAuthApps.findOneAuthAppByIdOrClientId(
				this.queryParams,
				!isOAuthAppsManager ? { projection: { clientSecret: 0 } } : {},
			);

			if (!oauthApp) {
				return API.v1.failure('OAuth app not found.');
			}

			if ('appId' in this.queryParams) {
				apiDeprecationLogger.parameter(this.route, 'appId', '7.0.0', this.response);
			}

			return API.v1.success({
				oauthApp,
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.update',
	{
		authRequired: true,
		validateParams: isUpdateOAuthAppParams,
		permissionsRequired: ['manage-oauth-apps'],
	},
	{
		async post() {
			const { appId } = this.bodyParams;

			const result = await updateOAuthApp(this.userId, appId, this.bodyParams);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'oauth-apps.delete',
	{
		authRequired: true,
		validateParams: isDeleteOAuthAppParams,
		permissionsRequired: ['manage-oauth-apps'],
	},
	{
		async post() {
			const { appId } = this.bodyParams;

			const result = await deleteOAuthApp(this.userId, appId);

			return API.v1.success(result);
		},
	},
);

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

const isOauthAppsAddParams = ajv.compile<OauthAppsAddParams>(OauthAppsAddParamsSchema);

const oauthAppsCreateEndpoints = API.v1.post(
	'oauth-apps.create',
	{
		authRequired: true,
		body: isOauthAppsAddParams,
		permissionsRequired: ['manage-oauth-apps'],
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			200: ajv.compile<{ application: IOAuthApps }>({
				type: 'object',
				properties: {
					application: { $ref: '#/components/schemas/IOAuthApps' },
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['application', 'success'],
				additionalProperties: false,
			}),
		},
	},

	async function action() {
		const application = await addOAuthApp(this.bodyParams, this.userId);

		return API.v1.success({ application });
	},
);

type OauthAppsCreateEndpoints = ExtractRoutesFromAPI<typeof oauthAppsCreateEndpoints>;

type OauthAppsListEndpoints = ExtractRoutesFromAPI<typeof oauthAppsListEndpoints>;

export type OAuthAppsEndpoints = OauthAppsCreateEndpoints | OauthAppsListEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OauthAppsCreateEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OauthAppsListEndpoints {}
}
