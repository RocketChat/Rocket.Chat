import { errCodes, federationSDK } from '@rocket.chat/federation-sdk';
import { every } from 'hono/combine';
import { createMiddleware } from 'hono/factory';

import { isAuthenticatedMiddleware } from './isAuthenticated';

function extractEntityId(
	params: { eventId?: string; mediaId?: string; roomId?: string },
	entityType: 'event' | 'media' | 'room',
): string | null {
	if (entityType === 'room') {
		return params.roomId ?? null;
	}

	if (entityType === 'media') {
		return params.mediaId ?? null;
	}

	if (entityType === 'event') {
		return params.eventId ?? null;
	}

	return null;
}

const canAccessResource = (entityType: 'event' | 'media' | 'room') =>
	createMiddleware(async (c, next) => {
		try {
			const mediaId = c.req.param('mediaId');
			const eventId = c.req.param('eventId');
			const roomId = c.req.param('roomId');

			const resourceId = extractEntityId({ mediaId, eventId, roomId }, entityType);
			if (!resourceId) {
				return c.json({ errcode: 'M_INVALID_PARAM', error: `Missing required ${entityType} identifier` }, 400);
			}

			const resourceAccess = await federationSDK.canAccessResource(entityType, resourceId, c.get('authenticatedServer'));
			if (!resourceAccess) {
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

export const canAccessResourceMiddleware = (entityType: 'event' | 'media' | 'room') =>
	every(isAuthenticatedMiddleware(), canAccessResource(entityType));
