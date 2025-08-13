import type { IOAuthApps } from '@rocket.chat/core-typings';
import { OAuthApps } from '@rocket.chat/models';
import {
	ajv,
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

type DeleteOAuthAppParams = {
	appId: string;
};

const DeleteOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		appId: {
			type: 'string',
		},
	},
	required: ['appId'],
	additionalProperties: false,
};

const isDeleteOAuthAppParams = ajv.compile<DeleteOAuthAppParams>(DeleteOAuthAppParamsSchema);

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

type OauthAppsGetParams = { clientId: string } | { appId: string } | { _id: string };

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

const isOauthAppsGetParams = ajv.compile<OauthAppsGetParams>(oauthAppsGetParamsSchema);

const oauthAppsEndpoints = API.v1
	.get(
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
	)
	.post(
		'oauth-apps.delete',
		{
			authRequired: true,
			body: isDeleteOAuthAppParams,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile<boolean>({ type: 'boolean' }),
			},
		},

		async function action() {
			const { appId } = this.bodyParams;

			const result = await deleteOAuthApp(this.userId, appId);

			return API.v1.success(result);
		},
	)
	.post(
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
	)
	.post(
		'oauth-apps.update',
		{
			authRequired: true,
			body: isUpdateOAuthAppParams,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
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
	)
	.get(
		'oauth-apps.get',
		{
			authRequired: true,
			query: isOauthAppsGetParams,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<{ oauthApp: IOAuthApps }>({
					type: 'object',
					properties: {
						oauthApp: { anyOf: [{ $ref: '#/components/schemas/IOAuthApps' }, { type: 'null' }] },
						success: {
							type: 'boolean',
							enum: [true],
						},
					},
					required: ['oauthApp', 'success'],
					additionalProperties: false,
				}),
			},
		},

		async function action() {
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
	);

export type OauthAppsEndpoints = ExtractRoutesFromAPI<typeof oauthAppsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OauthAppsEndpoints {}
}
