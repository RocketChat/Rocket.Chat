import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import { isMatrixErrorProps, isUserIdParamsProps, license, tags } from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const PresenceResponseSchema = {
	type: 'object',
	properties: {
		presence: { type: 'string', enum: ['online', 'offline', 'unavailable'] },
		last_active_ago: { type: 'number' },
		status_msg: { type: 'string' },
		currently_active: { type: 'boolean' },
	},
	required: ['presence'],
	additionalProperties: true,
};

const isPresenceResponseProps = ajv.compile(PresenceResponseSchema);

export const addPresenceRoutes = (router: ClientRouter) => {
	router.get(
		'/v3/presence/:userId/status',
		{
			params: isUserIdParamsProps,
			response: {
				200: isPresenceResponseProps,
				401: isMatrixErrorProps,
				501: isMatrixErrorProps,
			},
			tags,
			license,
		},
		isAppServiceAuthenticatedMiddleware(),
		async () => {
			// TODO(federation-sdk): expose presence service via federationSDK.getPresence(userId)
			return {
				statusCode: 200,
				body: {
					presence: 'offline',
				},
			};
		},
	);
};
