import type { MiddlewareHandler } from 'hono';

import { authenticateEngineRequest } from '../../lib/ai-agents/engineCredentials';

export type AiEngineVariables = { aiEngineId: string };

/**
 * Admits only a request carrying a current credential of a linked engine, for the routes an engine calls. The refusal
 * is the same whatever was wrong, and nothing about the request is logged.
 */
export const aiEngineAuthentication: MiddlewareHandler<{ Variables: AiEngineVariables }> = async (c, next) => {
	const engine = await authenticateEngineRequest(c.req.raw.headers);
	if (!engine) {
		return c.json({ success: false, error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer', 'Cache-Control': 'no-store' });
	}

	c.set('aiEngineId', engine.engineId);
	await next();
	c.header('Cache-Control', 'no-store');
};
