import { Logger } from '@rocket.chat/logger';
import type { Method } from '@rocket.chat/rest-typings';
import type { MiddlewareHandler } from 'hono';

import { applyBreakingChanges } from '../ApiClass';
import { API } from '../api';
import { type PermissionsPayload, checkPermissionsForInvocation } from '../api.helpers';
import type { TypedOptions } from '../definition';
import type { HonoContext } from '../router';

const logger = new Logger('PermissionsMiddleware');

export const permissionsMiddleware =
	(options: TypedOptions): MiddlewareHandler =>
	async (c: HonoContext, next) => {
		if (!options.permissionsRequired) {
			return next();
		}

		const user = c.get('user');

		if (!user) {
			if (applyBreakingChanges) {
				const unauthorized = API.v1.unauthorized('You must be logged in to do this');
				return c.json(unauthorized.body, unauthorized.statusCode);
			}

			const failure = API.v1.forbidden('User does not have the permissions required for this action [error-unauthorized]');
			return c.json(failure.body, failure.statusCode);
		}

		let hasPermission: boolean;
		try {
			hasPermission = await checkPermissionsForInvocation(
				user._id,
				options.permissionsRequired as PermissionsPayload,
				c.req.method as Method,
			);
		} catch (e) {
			logger.error({ msg: 'Error checking permissions for invocation', err: e });
			const error = API.v1.internalError();
			return c.json(error.body, error.statusCode);
		}

		if (!hasPermission) {
			if (applyBreakingChanges) {
				const forbidden = API.v1.forbidden('User does not have the permissions required for this action [error-unauthorized]');
				return c.json(forbidden.body, forbidden.statusCode);
			}

			const failure = API.v1.forbidden('User does not have the permissions required for this action [error-unauthorized]');
			return c.json(failure.body, failure.statusCode);
		}

		return next();
	};
