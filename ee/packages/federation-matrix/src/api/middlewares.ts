import type { EventAuthorizationService } from '@hs/federation-sdk';
import { errCodes } from '@hs/federation-sdk';
import type { EventID } from '@hs/room';

export const canAccessMedia = (federationAuth: EventAuthorizationService) => {
	return async (c: Context, next: Next) => {
		const mediaId = c.req.param('mediaId');
		const authHeader = c.req.header('Authorization') || '';
		const { method } = c.req;
		const { path } = c.req;
		const query = c.req.query();

		let uriForSignature = path;
		const queryString = new URLSearchParams(query).toString();
		if (queryString) {
			uriForSignature = `${path}?${queryString}`;
		}

		try {
			const body = method === 'GET' ? undefined : await c.req.json();

			const verificationResult = await federationAuth.canAccessMediaFromAuthorizationHeader(
				mediaId,
				authHeader,
				method,
				uriForSignature, // use URI with query params for signature verification
				body,
			);

			if (!verificationResult.authorized) {
				const errorResponse = errCodes[verificationResult.errorCode];
				return c.json(
					{
						errcode: errorResponse.errcode,
						error: errorResponse.error,
					},
					errorResponse.status,
				);
			}

			return next();
		} catch (error) {
			return c.json(errCodes.M_UNKNOWN, 500);
		}
	};
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
