import { Settings } from '@rocket.chat/core-services';
import type { MiddlewareHandler } from 'hono';

export const isFederationEnabledMiddleware: MiddlewareHandler = async (c, next) => {
	// TODO use federationSDK to check if federation is enabled
	if (!(await Settings.get<boolean>('Federation_Service_Enabled'))) {
		return c.json({ error: 'Federation is not enabled' }, 403);
	}
	return next();
};
