import type { Request, Response, NextFunction } from 'express';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

import { oAuth2ServerAuth } from '../../../oauth2-server-config/server/oauth/oauth2-server';

export type AuthenticationMiddlewareConfig = {
	rejectUnauthorized: boolean;
};

export const defaultAuthenticationMiddlewareConfig = {
	rejectUnauthorized: true,
};

export function authenticationMiddleware(config: AuthenticationMiddlewareConfig = defaultAuthenticationMiddlewareConfig) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { 'x-user-id': userId, 'x-auth-token': authToken } = req.headers;

		if (userId && authToken) {
			const query = {
				'_id': userId,
				'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(String(authToken)),
			};

			req.user = await Users.findOne(query);
		} else {
			req.user = oAuth2ServerAuth(req)?.user;
		}

		if (config.rejectUnauthorized && !req.user) {
			res.status(401).send('Unauthorized');
			return;
		}

		req.userId = req?.user?._id;

		next();
	};
}
