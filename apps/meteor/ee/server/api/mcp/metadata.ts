import type { RequestHandler } from 'express';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { getOAuthIssuer, getWellKnownUrl } from '../../../../server/oauth2-server/metadata';
import { settings } from '../../../../server/settings/cached';

const MCP_PATH = '/api/v1/mcp';
const PROTECTED_RESOURCE_METADATA = 'oauth-protected-resource';
const BARE_METADATA_PATH = `/.well-known/${PROTECTED_RESOURCE_METADATA}`;

/** The location (RFC 9728 §3.1) of the document that tells MCP clients where to get a token for the endpoint. */
export const getProtectedResourceMetadataUrl = (): string => getWellKnownUrl(`${getOAuthIssuer()}${MCP_PATH}`, PROTECTED_RESOURCE_METADATA);

export const getProtectedResourceMetadata = (issuer: string) => ({
	resource: `${issuer}${MCP_PATH}`,
	authorization_servers: [issuer],
	bearer_methods_supported: ['header'],
});

/**
 * Serves the protected resource metadata of the MCP endpoint at its RFC 9728 location, and at the bare path that clients
 * which ignore the 401 challenge fall back to. For a workspace served under a path, the RFC location is outside that
 * path, so this must see requests before the path prefix is stripped.
 */
export const serveProtectedResourceMetadata: RequestHandler = (req, res, next) => {
	const { pathname } = new URL(req.originalUrl, 'http://localhost');
	if (req.method !== 'GET' || ![new URL(getProtectedResourceMetadataUrl()).pathname, BARE_METADATA_PATH].includes(pathname)) {
		next();
		return;
	}

	if (!settings.get<boolean>('MCP_Enabled')) {
		res.status(404).send({ error: 'not_found', error_description: 'MCP endpoint is disabled' });
		return;
	}

	res.send(getProtectedResourceMetadata(getOAuthIssuer()));
};

(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(BARE_METADATA_PATH, serveProtectedResourceMetadata);
