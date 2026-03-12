import { type IUser, type RequiredField } from '@rocket.chat/core-typings';
import { type Logger } from '@rocket.chat/logger';
import type { MiddlewareHandler } from 'hono';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { applyBreakingChanges, type APIClass } from '../ApiClass';
import { convertHonoContextToApiActionContext, type HonoContext } from '../router';

const isUserWithUsername = (user: IUser | null): user is RequiredField<IUser, 'username'> => {
	return user !== null && typeof user === 'object' && 'username' in user && user.username !== undefined;
};

export function authenticationMiddlewareForHono(
	api: APIClass<string, Record<string, unknown>>,
	options: {
		authRequired?: boolean;
		authOrAnonRequired?: boolean;
		userWithoutUsername?: boolean;
		logger: Logger;
	},
): MiddlewareHandler {
	return async (c: HonoContext, next) => {
		const user = await api.authenticatedRoute(convertHonoContextToApiActionContext(c, { logger: options.logger }));
		const shouldPreventAnonymousRead = !user && options.authOrAnonRequired && !settings.get('Accounts_AllowAnonymousRead');
		const shouldPreventUserRead = !user && options.authRequired;

		if (shouldPreventAnonymousRead || shouldPreventUserRead) {
			const result = api.unauthorized('You must be logged in to do this.');
			// TODO: MAJOR
			if (!applyBreakingChanges) {
				Object.assign(result.body, {
					status: 'error',
					message: 'You must be logged in to do this.',
				});
			}

			return c.json(result.body, result.statusCode);
		}

		if (user && !options.userWithoutUsername && !isUserWithUsername(user)) {
			throw new Meteor.Error('error-unauthorized', 'Users must have a username');
		}

		c.set('user', user);
		return next();
	};
}
