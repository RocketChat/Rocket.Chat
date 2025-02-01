import { hashLoginToken } from '@rocket.chat/account-utils';
import { Authorization } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { Request, Response, NextFunction } from 'express';
import { oAuth2ServerAuth } from '../../../oauth2-server-config/server/oauth/oauth2-server';

type AuthenticationMiddlewareConfig = {
    rejectUnauthorized?: boolean;
    cookies?: boolean;
};

const defaultAuthConfig: AuthenticationMiddlewareConfig = {
    rejectUnauthorized: true,
    cookies: false,
};

declare module 'express' {
    interface Request {
        user?: { _id: string; [key: string]: any };
        userId?: string;
        unauthorized?: boolean;
    }
}


export function authenticationMiddleware(
    config: AuthenticationMiddlewareConfig = defaultAuthConfig,
) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (config.cookies) {
                req.headers['x-auth-token'] = req.cookies?.rc_token ?? req.headers['x-auth-token'];
                req.headers['x-user-id'] = req.cookies?.rc_uid ?? req.headers['x-user-id'];
            }

            const { 'x-user-id': userId, 'x-auth-token': authToken } = req.headers;

            if (userId && authToken) {
                req.user = await Users.findOneByIdAndLoginToken(
                    userId as string,
                    hashLoginToken(authToken as string),
                );
            } else {
                req.user = (await oAuth2ServerAuth(req))?.user;
            }

            if (config.rejectUnauthorized && !req.user) {
                res.status(401).send('Unauthorized');
                return;
            }

            req.userId = req.user?._id;
            next();
        } catch (error) {
            console.error('Authentication Middleware Error:', error);
            res.status(500).send('Internal Server Error');
        }
    };
}


export function hasPermissionMiddleware(
    permission: string,
    { rejectUnauthorized }: { rejectUnauthorized?: boolean } = { rejectUnauthorized: true },
) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                if (rejectUnauthorized) {
                    res.status(401).send('Unauthorized');
                    return;
                }
                req.unauthorized = true;
                return next();
            }

            const hasPermission = await Authorization.hasPermission(req.userId, permission);
            if (!hasPermission) {
                if (rejectUnauthorized) {
                    res.status(403).send('Forbidden');
                    return;
                }
                req.unauthorized = true;
            }

            next();
        } catch (error) {
            console.error('Permission Middleware Error:', error);
            res.status(500).send('Internal Server Error');
        }
    };
}
