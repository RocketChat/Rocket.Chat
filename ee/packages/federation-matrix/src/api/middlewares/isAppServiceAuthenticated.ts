import { errCodes, federationSDK } from '@rocket.chat/federation-sdk';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import { decodeXmppUserId, isFullXmppUserId, parseXmppUserId } from '../../helpers/parseXmppUserId';

export const isAppServiceAuthenticatedMiddleware = () =>
	createMiddleware(async (c: Context, next) => {
		try {
			const authHeader = c.req.header('Authorization') || '';
			const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
			const token = bearerMatch?.[1] ?? c.req.query('access_token');

			if (!token) {
				return c.json(
					{
						errcode: 'M_MISSING_TOKEN',
						error: 'Missing access token',
					},
					401,
				);
			}

			const appService = federationSDK.getRegistrationByAsToken(token);
			if (!appService) {
				return c.json(
					{
						errcode: 'M_UNKNOWN_TOKEN',
						error: 'Invalid application service token',
					},
					401,
				);
			}

			c.set('appService', appService);

			const appUserId = `@${appService.registration.senderLocalpart}:${federationSDK.getConfig('serverName')}`;
			const userId = c.req.query('user_id');

			if (!userId) {
				c.set('impersonatedUserId', appUserId);
				return next();
			}

			if (userId === appUserId) {
				c.set('impersonatedUserId', userId);
				return next();
			}

			const inNamespace = federationSDK.isUserInAppServiceNamespace(userId, appService.registration._id);
			if (!inNamespace) {
				return c.json(
					{
						errcode: 'M_FORBIDDEN',
						error: 'Application service cannot masquerade as this user',
					},
					403,
				);
			}

			const serverName = federationSDK.getConfig('serverName');

			const decoded = decodeXmppUserId(userId);

			// Not a packed XMPP JID: the registration flow stores these users under the
			// full MXID as-is, so impersonate that.
			if (!isFullXmppUserId(decoded)) {
				c.set('impersonatedUserId', userId);
				return next();
			}

			let decodedUsername;
			try {
				decodedUsername = parseXmppUserId(decoded);
			} catch {
				return c.json(
					{
						errcode: 'M_INVALID_USER_ID',
						error: 'Invalid user id',
					},
					400,
				);
			}

			if (!decodedUsername.resource) {
				return c.json(
					{
						errcode: 'M_INVALID_USER_ID',
						error: 'Invalid user id',
					},
					400,
				);
			}

			c.set('impersonatedUserId', `${decodedUsername.resource}:${serverName}`);

			return next();
		} catch (error) {
			return c.json(errCodes.M_UNKNOWN, 500);
		}
	});
