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
