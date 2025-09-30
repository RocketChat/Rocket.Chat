import { errCodes } from '@rocket.chat/federation-sdk';
import type { EventAuthorizationService } from '@rocket.chat/federation-sdk';
import { every } from 'hono/combine';
import { createMiddleware } from 'hono/factory';

import { isAuthenticatedMiddleware } from './isAuthenticated';

function extractEntityId(params: { eventId?: string; mediaId?: string; roomId?: string }, entityType: 'event' | 'media' | 'room'): string {
	if (entityType === 'room') {
		const { roomId } = params;
		if (!roomId) {
			throw new Error('Room ID is required');
		}

		return roomId;
	}

	if (entityType === 'media') {
		const { mediaId } = params;
		if (!mediaId) {
			throw new Error('Media ID is required');
		}

		return mediaId;
	}

	if (entityType === 'event') {
		const { eventId } = params;
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		return eventId;
	}

	throw new Error('Invalid entity type');
}

const canAccessResource = (federationAuth: EventAuthorizationService, entityType: 'event' | 'media' | 'room') =>
	createMiddleware(async (c, next) => {
		try {
			const authenticatedServer = c.get('authenticatedServer');
			if (!authenticatedServer) {
				return c.json({ errcode: 'M_UNAUTHORIZED', error: 'Missing Authorization header' }, 401);
			}

			const resourceAccess = await federationAuth.canAccessResource(
				entityType,
				extractEntityId(c.req.param(), entityType),
				authenticatedServer,
			);
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

export const canAccessResourceMiddleware = (federationAuth: EventAuthorizationService, entityType: 'event' | 'media' | 'room') =>
	every(isAuthenticatedMiddleware(federationAuth), canAccessResource(federationAuth, entityType));
