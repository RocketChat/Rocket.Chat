import express from 'express';
import { WebApp } from 'meteor/webapp';

import { getOAuthIssuer } from '../../../../server/oauth2-server/metadata';
import { settings } from '../../../../server/settings/cached';

const MCP_PATH = '/api/v1/mcp';
const PROTECTED_RESOURCE_METADATA_PATH = '/.well-known/oauth-protected-resource';

/** The path-aware location (RFC 9728 §3.1) of the document that tells MCP clients where to get a token. */
export const getProtectedResourceMetadataUrl = (): string => `${getOAuthIssuer()}${PROTECTED_RESOURCE_METADATA_PATH}${MCP_PATH}`;

export const getProtectedResourceMetadata = (issuer: string) => ({
	resource: `${issuer}${MCP_PATH}`,
	authorization_servers: [issuer],
	bearer_methods_supported: ['header'],
});

// eslint-disable-next-line new-cap
export const protectedResourceMetadataRouter = express.Router();

// Clients that do not read the location from the 401 challenge fall back to the bare path.
protectedResourceMetadataRouter.get([`${PROTECTED_RESOURCE_METADATA_PATH}${MCP_PATH}`, PROTECTED_RESOURCE_METADATA_PATH], (_req, res) => {
	if (!settings.get<boolean>('MCP_Enabled')) {
		res.status(404).send({ error: 'not_found', error_description: 'MCP endpoint is disabled' });
		return;
	}

	res.send(getProtectedResourceMetadata(getOAuthIssuer()));
});

(WebApp.connectHandlers as unknown as ReturnType<typeof express>).use(protectedResourceMetadataRouter);
