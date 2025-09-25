import { errCodes } from '@rocket.chat/federation-sdk';
import type { EventAuthorizationService } from '@rocket.chat/federation-sdk';
import { createMiddleware } from 'hono/factory';

function extractEntityId(params: {
	eventId?: string;
	mediaId?: string;
	roomId?: string;
}): { type: 'event' | 'media' | 'room'; id: string } | undefined {
	if (params.eventId) {
		return { type: 'event', id: params.eventId };
	}

	if (params.mediaId) {
		return { type: 'media', id: params.mediaId };
	}

	if (params.roomId) {
		return { type: 'room', id: params.roomId };
	}
}

export const canAccessResourceMiddleware = (federationAuth: EventAuthorizationService) =>
	createMiddleware(async (c, next) => {
		try {
			const authenticatedServer = c.get('authenticatedServer');
			if (!authenticatedServer) {
				return c.json({ errcode: 'M_UNAUTHORIZED', error: 'Missing Authorization header' }, 401);
			}

			const entity = extractEntityId(c.req.param());
			if (!entity) {
				// we're assuming there's no entity ID to get from route path params, so we're skipping the middleware
				// seems secure cause in case you don't have entity ID on the path the router will end up with 404 or routing to a different resource
				return next();
			}

			const verificationResult = await federationAuth.canAccessResource(entity.type, entity.id, authenticatedServer);
			if (!verificationResult) {
				return c.json(
					{
						errcode: 'M_FORBIDDEN',
						error: 'Access denied to resource',
					},
					403,
				);
			}

			return next();
		} catch (error) {
			return c.json(errCodes.M_UNKNOWN, 500);
		}
	});
