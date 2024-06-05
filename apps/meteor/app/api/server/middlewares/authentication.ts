import { hashLoginToken } from '@rocket.chat/account-utils';
import { Authorization } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { Request, Response, NextFunction } from 'express';

import { oAuth2ServerAuth } from '../../../oauth2-server-config/server/oauth/oauth2-server';

type AuthenticationMiddlewareConfig = {
	rejectUnauthorized?: boolean;
	cookies?: boolean;
};

type hasPermissionMiddlewareConfig = {
	rejectUnauthorized?: boolean;
};

async function authenticateUser(
	userId : string | undefined,
	authToken : string | undefined,
) {
	if(userId && authToken) {

		return (await Users.findOneByIdAndLoginToken(userId,hashLoginToken(authToken)));

	}
	return null
}

async function  authenticateWithOAuth(req:Request) {
	const AuthResult = await oAuth2ServerAuth(req);
	return AuthResult?.user || null;


	
}

async function handleUnauthorized(res : Response, message : string){
	return res.status(401).send(message);
}


export function authenticationMiddleware(
	config: AuthenticationMiddlewareConfig = {
		rejectUnauthorized: true,
		cookies: false,
	},
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {

			if (config.cookies) {
				req.headers['x-auth-token'] = req.cookies.rc_token ?? req.headers['x-auth-token'];
				req.headers['x-user-id'] = req.cookies.rc_uid ?? req.headers['x-user-id'];
			}
	
			const { 'x-user-id': userId, 'x-auth-token': authToken } = req.headers;
	
			req.user = await authenticateUser(userId as string, authToken as string) || await authenticateWithOAuth(req as Request);
			if (config.rejectUnauthorized && !req.user) {
				return handleUnauthorized(res, 'Unauthorized');
			}
	
			req.userId = req?.user?._id;
	
			next();
			
		} catch (error) {

			console.log("Error in authenticationMiddleware",error);
		   
            handleUnauthorized(res, 'Unauthorized');
			
		}
	};
}

export function hasPermissionMiddleware(
	permission: string,
	config : hasPermissionMiddlewareConfig = {
		rejectUnauthorized: true,
	}
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {

		try {
			if (!req.userId) {
				if (config.rejectUnauthorized) {
					return handleUnauthorized(res, 'Unauthorized');
				
				}
				req.unauthorized = true;
				return next();
			}
	
			if (!(await Authorization.hasPermission(req.userId, permission))) {
				if (config.rejectUnauthorized) {
					res.status(403).send('Forbidden');
					return;
				}
				req.unauthorized = true;
			}
			next();
			
		} catch (error) {

			console.log("Error in hasPermissionMiddleware",error);

			
			res.status(500).send('Internal Server Error');
			
		}

	};
}
