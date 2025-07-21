import { OAuthApps } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';
import { isUpdateOAuthAppParams, isOauthAppsGetParams, isOauthAppsAddParams, isDeleteOAuthAppParams } from '@rocket.chat/rest-typings';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/functions/addOAuthApp';
import { deleteOAuthApp } from '../../../oauth2-server-config/server/admin/methods/deleteOAuthApp';
import { updateOAuthApp } from '../../../oauth2-server-config/server/admin/methods/updateOAuthApp';
import { API } from '../api';
import QRCode from 'qrcode';
import { extractValidJWTPayload, generateJWT } from '/app/utils/server/lib/JWTHelper';

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

API.v1.addRoute(
	'oauth-apps.create',
	{
		authRequired: true,
		validateParams: isOauthAppsAddParams,
		permissionsRequired: ['manage-oauth-apps'],
	},
	{
		async post() {
			const application = await addOAuthApp(this.bodyParams, this.userId);

			return API.v1.success({ application });
		},
	},
);
API.v1.addRoute(
	'oauth-apps.qrcode-generate',
	{
		authRequired: false,
	},
	{
		async post() {
			try {

				const { sessionId } = this.bodyParams;
				if (!sessionId || typeof sessionId !== 'string') {
					return API.v1.failure('sessionId is required and must be a string');
				}

				const jwtPayload = {
					sessionId,
					timestamp: Date.now(),
					type: 'qr-auth'
				};

				const token = generateJWT(jwtPayload, process.env.JWT_SECRET || 'defaultSecret', 60);

				const qrCodeUrl = await QRCode.toDataURL(token, {
					width: 256,
					margin: 2,
					color: { dark: '#1f2329', light: '#ffffff' },
					errorCorrectionLevel: 'M',
					type: 'image/png',
				});

				return API.v1.success({
					success: true,
					qrCodeUrl,
				});

			} catch (error) {
				console.error('QR code generation error:', error);
				return API.v1.failure(
					{
						success: false,
						message: 'Failed to generate QR code',
					}
				);
			}
		},
	},
);

API.v1.addRoute(
	'oauth-apps.qrcode-verify',
	{
		authRequired: false,
	},
	{
		async post() {
			try {

				const { code } = this.bodyParams;
				if (!code || typeof code !== 'string') {
					return API.v1.failure({
						success: false,
						message: 'Code is required and must be a string'
					});
				}

				const decoded = extractValidJWTPayload(code, process.env.JWT_SECRET || 'defaultSecret');

				if (!decoded || decoded.context.type !== 'qr-auth') {
					return API.v1.failure({ success: false, message: 'Invalid token type' });
				}

				if (decoded && decoded.context.sessionId) {
					return API.v1.failure({ success: false, message: 'Invalid QR code or session expired' });
				}


				await api.broadcast('qr-code', { // Only success needs to be relayed to web client, failure will be shown to the mobile client.
					success: true,
					message: 'QR code verification successful',
					sessionId: decoded.context.sessionId
				});

				return API.v1.success({
					success: true,
					sessionId: decoded.context.sessionId,
					message: 'QR code verified successfully'
				});

			} catch (error) {
				return API.v1.failure({ success: false, message: 'QR code verification failed' });
			}
		}
	}
);