import QRCode from 'qrcode';
import { api, User } from '@rocket.chat/core-services';
import { Accounts } from 'meteor/accounts-base';

import { generateJWT, extractValidJWTPayload } from '/app/utils/server/lib/JWTHelper';
import { API } from '../api';

API.v1.addRoute(
	'qrcode.generate',
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
	'qrcode.verify',
	{
		authRequired: true,
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
					return API.v1.failure({
						success: false,
						message: 'Invalid QR code or session expired'
					});
				}

				const userId = this.userId;
				const token = Accounts._generateStampedLoginToken();
				Accounts._insertLoginToken(userId, token);
				await User.ensureLoginTokensLimit(userId);

				if (!token?.token) {
					return API.v1.failure({
						success: false,
						message: 'Failed to generate login token'
					});
				}

				await api.broadcast('qr-code', { // Only success needs to be relayed to web client, failure will be shown to the mobile client.
					sessionId: decoded.context.sessionId,
					authToken: token.token,
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