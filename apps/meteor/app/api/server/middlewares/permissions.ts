import type { Method } from '@rocket.chat/rest-typings';
import type { MiddlewareHandler } from 'hono';

import { applyBreakingChanges } from '../ApiClass';
import { API } from '../api';
import { type PermissionsPayload, checkPermissionsForInvocation } from '../api.helpers';
import type { TypedOptions } from '../definition';
import type { HonoContext } from '../router';

export const permissionsMiddleware =
	(options: TypedOptions): MiddlewareHandler =>
	async (c: HonoContext, next) => {
		if (!options.permissionsRequired) {
			return next();
		}

		const user = c.get('user');

		if (!user) {
			if (applyBreakingChanges) {
				const unauthorized = API.v1.unauthorized();
				return c.json(unauthorized.body, unauthorized.statusCode);
			}

			const message = 'User does not have the permissions required for this action';
			const failure = API.v1.failure({ error: message, message });
			return c.json(failure.body, failure.statusCode);
		}

		const hasPermission = await checkPermissionsForInvocation(
			user._id,
			options.permissionsRequired as PermissionsPayload,
			c.req.method as Method,
		);

		if (!hasPermission) {
			if (applyBreakingChanges) {
				const forbidden = API.v1.forbidden();
				return c.json(forbidden.body, forbidden.statusCode);
			}

			const message = 'User does not have the permissions required for this action';
			const failure = API.v1.failure({ error: message, message });
			return c.json(failure.body, failure.statusCode);
		}

		return next();
	};
