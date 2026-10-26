import express from 'express';
import request from 'supertest';

import { getProtectedResourceMetadataUrl, protectedResourceMetadataRouter } from './metadata';
import { settings } from '../../../../server/settings/cached';

jest.mock('meteor/webapp', () => ({ WebApp: { connectHandlers: { use: jest.fn() } } }), { virtual: true });

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: jest.fn() },
}));

const app = express().use(protectedResourceMetadataRouter);

const mockSettings = (values: Record<string, unknown>) => jest.mocked(settings.get).mockImplementation((id) => values[id] as never);

describe('MCP protected resource metadata', () => {
	beforeEach(() => {
		mockSettings({ MCP_Enabled: true, Site_Url: 'https://chat.example.com/' });
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

	it('does not describe other resources', async () => {
		const response = await request(app).get('/.well-known/oauth-protected-resource/api/v1/chat.postMessage');

		expect(response.status).toBe(404);
		expect(response.body).toEqual({});
	});

	it('is not found while MCP is disabled', async () => {
		mockSettings({ MCP_Enabled: false, Site_Url: 'https://chat.example.com' });

		const response = await request(app).get('/.well-known/oauth-protected-resource/api/v1/mcp');

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({ error: 'not_found' });
	});
});
