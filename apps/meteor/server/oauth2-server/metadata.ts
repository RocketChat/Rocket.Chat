import type { MiddlewareHandler } from 'hono';

import { getURL } from '../lib/utils/getURL';

/** The issuer identifier (RFC 8414) of this workspace's authorization server, which is also the base of its endpoints. */
export const getOAuthIssuer = (): string => getURL('', { full: true, cdn: false });

/**
 * Where the metadata of `identifier` is published: the well-known segment goes between the host and the path
 * (RFC 8414 §3.1, RFC 9728 §3.1).
 */
export const getWellKnownUrl = (identifier: string, name: string): string => {
	const { origin, pathname } = new URL(identifier);
	return `${origin}/.well-known/${name}${pathname === '/' ? '' : pathname}`;
};

export const getAuthorizationServerMetadata = (issuer: string) => ({
	issuer,
	authorization_endpoint: `${issuer}/oauth/authorize`,
	token_endpoint: `${issuer}/oauth/token`,
	// advertised even while registration is disabled, so clients get its explanation instead of guessing another endpoint
	registration_endpoint: `${issuer}/oauth/register`,
	response_types_supported: ['code'],
	grant_types_supported: ['authorization_code', 'refresh_token'],
	token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
	code_challenge_methods_supported: ['S256'],
});

/** Whether `path` is where one of `urls` is published, with or without a trailing slash. */
export const isWellKnownPath = (path: string, urls: string[]): boolean => {
	const pathname = path.replace(/(.)\/$/, '$1');
	return urls.some((url) => new URL(url, 'http://localhost').pathname === pathname);
};

/**
 * Serves the authorization server metadata at its RFC 8414 location. For a workspace served under a path, that location
 * is outside the path, so this must see requests before the path prefix is stripped.
 */
export const serveAuthorizationServerMetadata: MiddlewareHandler = async (c, next) => {
	const issuer = getOAuthIssuer();
	if (!isWellKnownPath(c.req.path, [getWellKnownUrl(issuer, 'oauth-authorization-server')])) {
		return next();
	}

	return c.json(getAuthorizationServerMetadata(issuer));
};
