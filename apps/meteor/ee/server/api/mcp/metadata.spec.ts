import { createRootApp } from '@rocket.chat/http-router';

import { getProtectedResourceMetadataUrl, serveProtectedResourceMetadata } from './metadata';

const settingValues: Record<string, unknown> = {};

jest.mock('../../../../server/lib/http/httpServer', () => ({ httpApp: { get: jest.fn() } }));

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

const app = createRootApp().get('/.well-known/oauth-protected-resource/*', serveProtectedResourceMetadata);

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
			const response = await app.request(path);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				resource: 'https://chat.example.com/api/v1/mcp',
				authorization_servers: ['https://chat.example.com'],
				bearer_methods_supported: ['header'],
			});
		},
	);

	it('places the path of a workspace under a prefix after the well-known segment', async () => {
		deploy('https://example.com/chat', { pathPrefix: '/chat' });

		expect(getProtectedResourceMetadataUrl()).toBe('https://example.com/.well-known/oauth-protected-resource/chat/api/v1/mcp');

		const response = await app.request('/.well-known/oauth-protected-resource/chat/api/v1/mcp');

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			resource: 'https://example.com/chat/api/v1/mcp',
			authorization_servers: ['https://example.com/chat'],
		});
	});

	it('accepts a trailing slash', async () => {
		expect((await app.request('/.well-known/oauth-protected-resource/api/v1/mcp/')).status).toBe(200);
	});

	it('answers GET and HEAD only', async () => {
		expect((await app.request('/.well-known/oauth-protected-resource/api/v1/mcp', { method: 'HEAD' })).status).toBe(200);
		expect((await app.request('/.well-known/oauth-protected-resource/api/v1/mcp', { method: 'POST' })).status).toBe(404);
	});

	it('does not describe other resources', async () => {
		const response = await app.request('/.well-known/oauth-protected-resource/api/v1/chat.postMessage');

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).not.toMatch(/json/);
	});

	it('is not found while MCP is disabled', async () => {
		deploy('https://chat.example.com', { mcpEnabled: false });

		const response = await app.request('/.well-known/oauth-protected-resource/api/v1/mcp');

		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({ error: 'not_found' });
	});
});
