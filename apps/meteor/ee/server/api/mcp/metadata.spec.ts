import express from 'express';
import request from 'supertest';

import { getProtectedResourceMetadataUrl, serveProtectedResourceMetadata } from './metadata';

const settingValues: Record<string, unknown> = {};

jest.mock('meteor/webapp', () => ({ WebApp: { rawConnectHandlers: { use: jest.fn() } } }), { virtual: true });

jest.mock('../../../../server/settings', () => ({
	settings: { get: (id: string) => settingValues[id] },
}));

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: (id: string) => settingValues[id] },
}));

const runtimeGlobal = globalThis as typeof globalThis & { __meteor_runtime_config__?: { ROOT_URL_PATH_PREFIX?: string } };

const deploy = (siteUrl: string, { pathPrefix = '', mcpEnabled = true } = {}) => {
	Object.assign(settingValues, { Site_Url: siteUrl, MCP_Enabled: mcpEnabled });
	runtimeGlobal.__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: pathPrefix };
};

const app = express().use('/.well-known/oauth-protected-resource', serveProtectedResourceMetadata);

describe('MCP protected resource metadata', () => {
	beforeEach(() => {
		deploy('https://chat.example.com/');
	});

	it('is located at the path-aware well-known URL of the MCP endpoint', () => {
		expect(getProtectedResourceMetadataUrl()).toBe('https://chat.example.com/.well-known/oauth-protected-resource/api/v1/mcp');
	});

	it.each(['/.well-known/oauth-protected-resource/api/v1/mcp', '/.well-known/oauth-protected-resource'])(
		'names the workspace as the authorization server of the MCP endpoint at %s',
		async (path) => {
			const response = await request(app).get(path);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				resource: 'https://chat.example.com/api/v1/mcp',
				authorization_servers: ['https://chat.example.com'],
				bearer_methods_supported: ['header'],
			});
		},
	);

	it('places the path of a workspace under a prefix after the well-known segment', async () => {
		deploy('https://example.com/chat', { pathPrefix: '/chat' });

		expect(getProtectedResourceMetadataUrl()).toBe('https://example.com/.well-known/oauth-protected-resource/chat/api/v1/mcp');

		const response = await request(app).get('/.well-known/oauth-protected-resource/chat/api/v1/mcp');

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			resource: 'https://example.com/chat/api/v1/mcp',
			authorization_servers: ['https://example.com/chat'],
		});
	});

	it('does not describe other resources', async () => {
		const response = await request(app).get('/.well-known/oauth-protected-resource/api/v1/chat.postMessage');

		expect(response.status).toBe(404);
		expect(response.body).toEqual({});
	});

	it('is not found while MCP is disabled', async () => {
		deploy('https://chat.example.com', { mcpEnabled: false });

		const response = await request(app).get('/.well-known/oauth-protected-resource/api/v1/mcp');

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({ error: 'not_found' });
	});
});
