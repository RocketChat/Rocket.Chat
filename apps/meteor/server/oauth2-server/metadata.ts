import type { RequestHandler } from 'express';

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
	response_types_supported: ['code'],
	grant_types_supported: ['authorization_code', 'refresh_token'],
	token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
	code_challenge_methods_supported: ['S256'],
});

/**
 * Serves the authorization server metadata at its RFC 8414 location. For a workspace served under a path, that location
 * is outside the path, so this must see requests before the path prefix is stripped.
 */
export const serveAuthorizationServerMetadata: RequestHandler = (req, res, next) => {
	const issuer = getOAuthIssuer();
	const { pathname } = new URL(req.originalUrl, 'http://localhost');
	if (!['GET', 'HEAD'].includes(req.method) || pathname !== new URL(getWellKnownUrl(issuer, 'oauth-authorization-server')).pathname) {
		next();
		return;
	}

	res.send(getAuthorizationServerMetadata(issuer));
};
