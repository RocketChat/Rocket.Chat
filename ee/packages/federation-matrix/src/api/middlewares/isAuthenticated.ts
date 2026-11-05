import { errCodes, federationSDK } from '@rocket.chat/federation-sdk';
import type { Context, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { logger } from '../logger';

export const isAuthenticatedMiddleware = (): MiddlewareHandler =>
	createMiddleware(async (c: Context, next) => {
		try {
			const { method } = c.req;
			const body = c.req.raw.body ? await c.req.raw.clone().json() : undefined;
			const url = new URL(c.req.url);
			const path = url.pathname + url.search;
			const authHeader = c.req.header('Authorization') || '';
			if (!authHeader) {
				logger.info({ msg: 'Missing Authorization header', method, path: c.req.path });
				return c.json(
					{
						errcode: 'M_UNAUTHORIZED',
						error: 'Missing Authorization header',
					},
					401,
				);
			}

			const verificationResult = await federationSDK.verifyRequestSignature(authHeader, method, path, body);
			if (!verificationResult) {
				logger.warn({ msg: 'Signature not verified', method, path: c.req.path });
				return c.json(
					{
						errcode: errCodes.M_UNAUTHORIZED.errcode,
						error: errCodes.M_UNAUTHORIZED.error,
					},
					errCodes.M_UNAUTHORIZED.status,
				);
			}

			c.set('authenticatedServer', verificationResult);
			return next();
		} catch (err) {
			logger.error({ msg: 'Authentication failed', method: c.req.method, path: c.req.path, err });
			return c.json(errCodes.M_UNKNOWN, 500);
		}
	});
