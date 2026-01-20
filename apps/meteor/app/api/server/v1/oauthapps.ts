import { OAuthApps } from '@rocket.chat/models';
import {
	BadRequestErrorResponseSchema,
	UnauthorizedErrorResponseSchema,
	ForbiddenErrorResponseSchema,
	GETOAuthAppsListQuerySchema,
	GETOAuthAppsListResponseSchema,
	POSTOAuthAppsDeleteBodySchema,
	POSTOAuthAppsDeleteResponseSchema,
	POSTOAuthAppsCreateBodySchema,
	POSTOAuthAppsCreateResponseSchema,
	POSTOAuthAppsUpdateBodySchema,
	POSTOAuthAppsUpdateResponseSchema,
	GETOAuthAppsGetQuerySchema,
	GETOAuthAppsGetResponseSchema,
} from '@rocket.chat/rest-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/functions/addOAuthApp';
import { deleteOAuthApp } from '../../../oauth2-server-config/server/admin/methods/deleteOAuthApp';
import { updateOAuthApp } from '../../../oauth2-server-config/server/admin/methods/updateOAuthApp';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const oauthAppsEndpoints = API.v1
	.get(
		'oauth-apps.list',
		{
			authRequired: true,
			query: GETOAuthAppsListQuerySchema,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				200: GETOAuthAppsListResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
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
			body: POSTOAuthAppsDeleteBodySchema,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				200: POSTOAuthAppsDeleteResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
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
			body: POSTOAuthAppsCreateBodySchema,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				200: POSTOAuthAppsCreateResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
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
			body: POSTOAuthAppsUpdateBodySchema,
			permissionsRequired: ['manage-oauth-apps'],
			response: {
				200: POSTOAuthAppsUpdateResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
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
			query: GETOAuthAppsGetQuerySchema,
			response: {
				200: GETOAuthAppsGetResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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

			return API.v1.success({
				oauthApp,
			});
		},
	);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof oauthAppsEndpoints> {}
}
