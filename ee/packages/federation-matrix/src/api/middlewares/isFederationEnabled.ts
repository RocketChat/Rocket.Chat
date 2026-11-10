import { Settings } from '@rocket.chat/core-services';
import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

export const isFederationEnabledMiddleware: MiddlewareHandler = createMiddleware(async (c, next) => {
	// TODO use federationSDK to check if federation is enabled
	if (!(await Settings.get<boolean>('Federation_Service_Enabled'))) {
		return c.json({ error: 'Federation is not enabled' }, 403);
	}
	return next();
});
