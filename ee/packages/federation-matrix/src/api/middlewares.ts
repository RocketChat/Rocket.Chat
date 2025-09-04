import type { EventAuthorizationService } from '@hs/federation-sdk';
import type { Context, Next } from 'hono';

const errCodes = {
	M_UNAUTHORIZED: {
		errcode: 'M_UNAUTHORIZED',
		error: 'Invalid or missing signature',
	},
	M_FORBIDDEN: {
		errcode: 'M_FORBIDDEN',
		error: 'Access denied',
	},
	M_UNKNOWN: {
		errcode: 'M_UNKNOWN',
		error: 'Internal server error while processing request',
	},
};

export const aclMiddleware = (federationAuth: EventAuthorizationService) => async (c: Context, next: Next) => {
	const { eventId } = c.req.param();

	try {
		const verificationResult = await federationAuth.verifyRequestSignature({
			method: c.req.method,
			uri: c.req.path,
			headers: Object.fromEntries(c.req.raw.headers.entries()),
			body: undefined, // GET requests don't have body
		});

		if (!verificationResult.valid) {
			return c.json(errCodes.M_UNAUTHORIZED, 401);
		}

		const authResult = await federationAuth.canAccessEvent(eventId, verificationResult.serverName);
		if (!authResult.authorized) {
			return c.json(errCodes.M_FORBIDDEN, 403);
		}

		return next();
	} catch (error) {
		return c.json(errCodes.M_UNKNOWN, 500);
	}
};
