import { License } from '@rocket.chat/core-services';
import type { MiddlewareHandler } from 'hono';

export const isLicenseEnabledMiddleware: MiddlewareHandler = async (c, next) => {
	if (!(await License.hasModule('federation'))) {
		return c.json({ error: 'Federation is not enabled' }, 403);
	}
	return next();
};
