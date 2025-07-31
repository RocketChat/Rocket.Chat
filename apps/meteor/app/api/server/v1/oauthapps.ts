import type { IOAuthApps } from '@rocket.chat/core-typings';
import { OAuthApps } from '@rocket.chat/models';
import { ajv, isOauthAppsGetParams, isDeleteOAuthAppParams } from '@rocket.chat/rest-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/functions/addOAuthApp';
import { deleteOAuthApp } from '../../../oauth2-server-config/server/admin/methods/deleteOAuthApp';
import { updateOAuthApp } from '../../../oauth2-server-config/server/admin/methods/updateOAuthApp';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

API.v1.addRoute(
	'oauth-apps.list',
	{ authRequired: true, permissionsRequired: ['manage-oauth-apps'] },
	{
		async get() {
			return API.v1.success({
				oauthApps: await OAuthApps.find().toArray(),
			});
		},
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

type UpdateOAuthAppParams = {
	appId: string;
	name: string;
	active: boolean;
	clientId?: string | undefined;
	clientSecret?: string | undefined;
	redirectUri: string;
};

const UpdateOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		appId: {
			type: 'string',
		},
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
	required: ['appId', 'name', 'active', 'redirectUri'],
	additionalProperties: false,
};

const isUpdateOAuthAppParams = ajv.compile<UpdateOAuthAppParams>(UpdateOAuthAppParamsSchema);

const oauthAppsuUpdateEndpoints = API.v1.post(
	'oauth-apps.update',
	{
		authRequired: true,
		body: isUpdateOAuthAppParams,
		permissionsRequired: ['manage-oauth-apps'],
		response: {
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: object;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'object' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			200: ajv.compile<IOAuthApps | null>({
				allOf: [
					{ anyOf: [{ $ref: '#/components/schemas/IOAuthApps' }, { type: 'null' }] },
					{
						type: 'object',
						properties: {
							success: { type: 'boolean', enum: [true] },
						},
						required: ['success'],
					},
				],
			}),
		},
	},
	async function action() {
		const { appId } = this.bodyParams;

		const result = await updateOAuthApp(this.userId, appId, this.bodyParams);

		return API.v1.success(result);
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
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: object;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'object' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

type OauthAppsuUpdateEndpoints = ExtractRoutesFromAPI<typeof oauthAppsuUpdateEndpoints>;

export type OAuthAppsEndpoints = OauthAppsCreateEndpoints | OauthAppsuUpdateEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OauthAppsCreateEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OauthAppsuUpdateEndpoints {}
}
