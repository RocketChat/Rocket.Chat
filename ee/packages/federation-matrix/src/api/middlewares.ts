import type { EventAuthorizationService } from '@hs/federation-sdk';
import { errCodes } from '@hs/federation-sdk';
import type { EventID } from '@hs/room';
import type { Context, Next } from 'hono';

export const canAccessMedia = (federationAuth: EventAuthorizationService) => async (c: Context, next: Next) => {
	try {
		const url = new URL(c.req.url);
		const path = url.search ? `${c.req.path}${url.search}` : c.req.path;

		const verificationResult = await federationAuth.canAccessMediaFromAuthorizationHeader(
			c.req.param('mediaId'),
			c.req.header('Authorization') || '',
			c.req.method,
			path,
			undefined,
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

export const canAccessEvent = (federationAuth: EventAuthorizationService) => async (c: Context, next: Next) => {
	try {
		const url = new URL(c.req.url);
		const path = url.search ? `${c.req.path}${url.search}` : c.req.path;

		const verificationResult = await federationAuth.canAccessEventFromAuthorizationHeader(
			c.req.param('eventId') as EventID,
			c.req.header('Authorization') || '',
			c.req.method,
			path,
			undefined,
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
