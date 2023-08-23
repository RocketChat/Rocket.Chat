import { hashLoginToken } from '@rocket.chat/account-utils';
import { Users } from '@rocket.chat/models';
import type { Request, Response, NextFunction } from 'express';

import { oAuth2ServerAuth } from '../../../oauth2-server-config/server/oauth/oauth2-server';

type AuthenticationMiddlewareConfig = {
	rejectUnauthorized: boolean;
};

const defaultAuthenticationMiddlewareConfig = {
	rejectUnauthorized: true,
};

export function authenticationMiddleware(config: AuthenticationMiddlewareConfig = defaultAuthenticationMiddlewareConfig) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { 'x-user-id': userId, 'x-auth-token': authToken } = req.headers;

		if (userId && authToken) {
			req.user = (await Users.findOneByIdAndLoginToken(userId as string, hashLoginToken(authToken as string))) || undefined;
		} else {
			req.user = (await oAuth2ServerAuth(req))?.user;
		}

		if (config.rejectUnauthorized && !req.user) {
			res.status(401).send('Unauthorized');
			return;
		}

		req.userId = req?.user?._id;

		next();
	};
}
