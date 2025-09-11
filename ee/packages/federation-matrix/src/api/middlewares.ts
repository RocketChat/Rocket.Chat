import type { EventAuthorizationService } from '@hs/federation-sdk';
import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const errCodes: Record<string, { errcode: string; error: string; status: ContentfulStatusCode }> = {
	M_UNAUTHORIZED: {
		errcode: 'M_UNAUTHORIZED',
		error: 'Invalid or missing signature',
		status: 401,
	},
	M_FORBIDDEN: {
		errcode: 'M_FORBIDDEN',
		error: 'Access denied',
		status: 403,
	},
	M_UNKNOWN: {
		errcode: 'M_UNKNOWN',
		error: 'Internal server error while processing request',
		status: 500,
	},
};

export const canAccessEvent = (federationAuth: EventAuthorizationService) => async (c: Context, next: Next) => {
	const { eventId } = c.req.param();

	try {
		const verificationResult = await federationAuth.canAccessEventFromAuthorizationHeader(
			eventId,
			c.req.header('Authorization') || '',
			c.req.method,
			c.req.path,
			await c.req.json(),
		);

		if (!verificationResult.authorized) {
			return c.json(
				{
					errcode: errCodes[verificationResult.errorCode].errcode,
					error: errCodes[verificationResult.errorCode].error,
				},
				errCodes[verificationResult.errorCode].status,
			);
		}

		return next();
	} catch (error) {
		return c.json(errCodes.M_UNKNOWN, 500);
	}
};
