import { Settings } from '@rocket.chat/core-services';
import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import mem from 'mem';

import { logger } from '../logger';

// cache for 60 seconds
const getAllowList = mem(
	async () => {
		const allowListSetting = await Settings.get<string>('Federation_Service_Allow_List');
		return allowListSetting
			? allowListSetting
					.split(',')
					.map((d) => d.trim().toLowerCase())
					.filter(Boolean)
			: null;
	},
	{ maxAge: 60000 },
);

// values may be quoted strings or bare tokens (RFC 9110), as servers built on ruma only quote values that need it
const AUTH_PARAM_REGEX = /(?<![\w!#$%&'*+.^`|~-])([\w!#$%&'*+.^`|~-]+)=(?:"((?:[^"\\]|\\.)*)"|([^\s,"]+))/g;

// TODO: Replace parseMatrixAuthorizationHeader with extractSignaturesFromHeader once federation-sdk exports it
function parseMatrixAuthorizationHeader(header: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [, name, quoted, token] of header.matchAll(AUTH_PARAM_REGEX)) {
		result[name.toLowerCase()] = quoted !== undefined ? quoted.replace(/\\(.)/g, '$1') : token;
	}
	return result;
}

export const isFederationDomainAllowedMiddleware: MiddlewareHandler = createMiddleware(async (c, next) => {
	const allowList = await getAllowList();
	if (!allowList || allowList.length === 0) {
		// No restriction, allow all
		return next();
	}

	// Extract all key-value pairs from Matrix authorization header
	const authHeader = c.req.header('authorization');
	if (!authHeader) {
		logger.info({ msg: 'Missing Authorization header', method: c.req.method, path: c.req.path });
		return c.json({ errcode: 'M_UNAUTHORIZED', error: 'Missing Authorization headers.' }, 401);
	}

	const authValues = parseMatrixAuthorizationHeader(authHeader);
	const domain = authValues.origin?.toLowerCase();
	if (!domain) {
		logger.warn({
			msg: 'Missing origin',
			method: c.req.method,
			path: c.req.path,
			headerParams: Object.keys(authValues),
		});
		return c.json({ errcode: 'M_MISSING_ORIGIN', error: 'Missing origin in authorization header.' }, 401);
	}

	// Check if domain is in allowed list (exact match only)
	if (allowList.some((allowed) => domain === allowed)) {
		return next();
	}

	logger.info({ msg: 'Domain not allowed', method: c.req.method, path: c.req.path, origin: domain });
	return c.json({ errcode: 'M_FORBIDDEN', error: 'Federation from this domain is not allowed.' }, 403);
});
