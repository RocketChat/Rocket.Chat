import { Settings } from '@rocket.chat/core-services';
import { createMiddleware } from 'hono/factory';
import mem from 'mem';

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

/**
 * Parses all key-value pairs from a Matrix authorization header.
 * Example: X-Matrix origin="matrix.org", key="value", ...
 * Returns an object with all parsed values.
 */
// TODO make this function more of a utility if needed elsewhere
function parseMatrixAuthorizationHeader(header: string): Record<string, string> {
	const result: Record<string, string> = {};
	// Match key="value" pairs
	const regex = /([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"/g;
	let match;
	while ((match = regex.exec(header)) !== null) {
		result[match[1]] = match[2];
	}
	return result;
}

export const isFederationDomainAllowedMiddleware = createMiddleware(async (c, next) => {
	const allowList = await getAllowList();
	if (!allowList || allowList.length === 0) {
		// No restriction, allow all
		return next();
	}

	// Extract all key-value pairs from Matrix authorization header
	const authHeader = c.req.header('authorization');
	if (!authHeader) {
		return c.json({ errcode: 'M_UNAUTHORIZED', error: 'Missing Authorization headers.' }, 401);
	}

	const authValues = parseMatrixAuthorizationHeader(authHeader);
	const domain = authValues.origin?.toLowerCase();
	if (!domain) {
		return c.json({ errcode: 'M_MISSING_ORIGIN', error: 'Missing origin in authorization header.' }, 401);
	}

	// Check if domain is in allowed list
	if (allowList.some((allowed) => domain.endsWith(allowed))) {
		return next();
	}

	return c.json({ errcode: 'M_FORBIDDEN', error: 'Federation from this domain is not allowed.' }, 403);
});
