import express from 'express';
import request from 'supertest';

import { getAuthorizationServerMetadata, getOAuthIssuer, getWellKnownUrl, serveAuthorizationServerMetadata } from './metadata';
import { settings } from '../settings';

jest.mock('../settings', () => ({
	settings: { get: jest.fn() },
}));

const runtimeGlobal = globalThis as typeof globalThis & { __meteor_runtime_config__?: { ROOT_URL_PATH_PREFIX?: string } };

const deploy = (siteUrl: string, pathPrefix = '') => {
	jest.mocked(settings.get).mockImplementation((id) => (id === 'Site_Url' ? siteUrl : undefined) as never);
	runtimeGlobal.__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: pathPrefix };
};

const app = express().use('/.well-known/oauth-authorization-server', serveAuthorizationServerMetadata);

describe('getOAuthIssuer', () => {
	it('derives the issuer from the site URL without a trailing slash', () => {
		deploy('https://chat.example.com/');

		expect(getOAuthIssuer()).toBe('https://chat.example.com');
	});

	it('keeps the path of a workspace served under a prefix', () => {
		deploy('https://example.com/chat', '/chat');

		expect(getOAuthIssuer()).toBe('https://example.com/chat');
	});

	it('adds a path prefix the site URL leaves out', () => {
		deploy('https://example.com', '/chat');

		expect(getOAuthIssuer()).toBe('https://example.com/chat');
	});
});

describe('getWellKnownUrl', () => {
	it('appends the well-known segment to an identifier without a path', () => {
		expect(getWellKnownUrl('https://chat.example.com', 'oauth-authorization-server')).toBe(
			'https://chat.example.com/.well-known/oauth-authorization-server',
		);
	});

	it('inserts the well-known segment between the host and the path', () => {
		expect(getWellKnownUrl('https://example.com/chat/api/v1/mcp', 'oauth-protected-resource')).toBe(
			'https://example.com/.well-known/oauth-protected-resource/chat/api/v1/mcp',
		);
	});
});

describe('getAuthorizationServerMetadata', () => {
	// The token endpoint requires a client secret, and the library rejects the plain method.
	it('describes the code flow with S256 PKCE and secret-based client authentication, at endpoints under the issuer', () => {
		expect(getAuthorizationServerMetadata('https://chat.example.com')).toEqual({
			issuer: 'https://chat.example.com',
			authorization_endpoint: 'https://chat.example.com/oauth/authorize',
			token_endpoint: 'https://chat.example.com/oauth/token',
			registration_endpoint: 'https://chat.example.com/oauth/register',
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
			code_challenge_methods_supported: ['S256'],
		});
	});

	// A client that finds no registration endpoint guesses one, and gets an empty 405 from the workspace.
	it('advertises the registration endpoint', () => {
		expect(getAuthorizationServerMetadata('https://chat.example.com')).toMatchObject({
			registration_endpoint: 'https://chat.example.com/oauth/register',
		});
	});
});

describe('serveAuthorizationServerMetadata', () => {
	it('serves the metadata at the well-known path', async () => {
		deploy('https://chat.example.com');

		const response = await request(app).get('/.well-known/oauth-authorization-server');

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({ issuer: 'https://chat.example.com' });
	});

	it('serves the metadata of a workspace under a prefix at the host root, followed by the prefix', async () => {
		deploy('https://example.com/chat', '/chat');

		const response = await request(app).get('/.well-known/oauth-authorization-server/chat');

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({ issuer: 'https://example.com/chat' });
		expect((await request(app).get('/.well-known/oauth-authorization-server')).status).toBe(404);
	});

	it('accepts a trailing slash', async () => {
		deploy('https://chat.example.com');

		expect((await request(app).get('/.well-known/oauth-authorization-server/')).status).toBe(200);
	});

	it('answers GET and HEAD only', async () => {
		deploy('https://chat.example.com');

		expect((await request(app).head('/.well-known/oauth-authorization-server')).status).toBe(200);
		expect((await request(app).post('/.well-known/oauth-authorization-server')).status).toBe(404);
	});
});
