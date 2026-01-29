import { errCodes, federationSDK } from '@rocket.chat/federation-sdk';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

export const isAuthenticatedMiddleware = () =>
	createMiddleware(async (c: Context, next) => {
		try {
			const { method } = c.req;
			const body = c.req.raw.body ? await c.req.raw.clone().json() : undefined;
			const url = new URL(c.req.url);
			const path = url.pathname + url.search;
			const authHeader = c.req.header('Authorization') || '';
			if (!authHeader) {
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
		} catch (error) {
			return c.json(errCodes.M_UNKNOWN, 500);
		}
	});
