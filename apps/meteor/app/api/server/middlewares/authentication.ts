import { hashLoginToken } from '@rocket.chat/account-utils';
import { Authorization } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { Request, Response, NextFunction } from 'express';

import { oAuth2ServerAuth } from '../../../oauth2-server-config/server/oauth/oauth2-server';

type AuthenticationMiddlewareConfig = {
	rejectUnauthorized?: boolean;
	cookies?: boolean;
};

/**
 * Creates an Express middleware that authenticates requests using header/cookie tokens or OAuth2.
 *
 * The middleware sets `req.user` when authentication succeeds and `req.userId` to the authenticated user's `_id`.
 * If `rejectUnauthorized` is true and no user is authenticated, the middleware responds with HTTP 401 and stops the request.
 *
 * @param config - Configuration for the middleware.
 *   - `rejectUnauthorized` (default: `true`): If true, unauthenticated requests are rejected with HTTP 401.
 *   - `cookies` (default: `false`): If true, authentication values are read from cookies when available.
 * @returns An Express middleware function that enforces authentication and populates `req.user` and `req.userId`.
 */
export function authenticationMiddleware(
	config: AuthenticationMiddlewareConfig = {
		rejectUnauthorized: true,
		cookies: false,
	},
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (config.cookies) {
			req.headers['x-auth-token'] = req.cookies.rc_token ?? req.headers['x-auth-token'];
			req.headers['x-user-id'] = req.cookies.rc_uid ?? req.headers['x-user-id'];
		}

		const { 'x-user-id': userId, 'x-auth-token': authToken } = req.headers;

		if (userId && authToken) {
			req.user = (await Users.findOneByIdAndLoginToken(userId as string, hashLoginToken(authToken as string))) || undefined;
		} else {
			req.user = await oAuth2ServerAuth({
				headers: req.headers as Record<string, string | undefined>,
				query: req.query as Record<string, string | undefined>,
			});
		}

		if (config.rejectUnauthorized && !req.user) {
			res.status(401).send('Unauthorized');
			return;
		}

		req.userId = req?.user?._id;

		next();
	};
}

export function hasPermissionMiddleware(
	permission: string,
	{ rejectUnauthorized } = {
		rejectUnauthorized: true,
	},
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!req.userId) {
			if (rejectUnauthorized) {
				res.status(401).send('Unauthorized');
				return;
			}
			req.unauthorized = true;
			return next();
		}

		if (!(await Authorization.hasPermission(req.userId, permission))) {
			if (rejectUnauthorized) {
				res.status(403).send('Forbidden');
				return;
			}
			req.unauthorized = true;
		}
		next();
	};
}