import { License } from '@rocket.chat/license';
import { OAuthApps } from '@rocket.chat/models';

import { registerOAuthClient } from './registerOAuthClient';
import { settings } from '../../../settings/cached';

jest.mock('@rocket.chat/license', () => ({
	License: { hasModule: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	OAuthApps: { insertOne: jest.fn() },
}));

jest.mock('../../../settings/cached', () => ({
	settings: { get: jest.fn() },
}));

const claude = {
	client_name: 'Claude',
	redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
	grant_types: ['authorization_code', 'refresh_token'],
	response_types: ['code'],
	token_endpoint_auth_method: 'client_secret_post',
};

describe('registerOAuthClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(License.hasModule).mockReturnValue(true);
		jest.mocked(settings.get).mockImplementation((id) => ['MCP_Enabled', 'OAuth2_Allow_Dynamic_Client_Registration'].includes(id));
		jest.mocked(OAuthApps.insertOne).mockResolvedValue({ acknowledged: true, insertedId: 'app-id' });
	});

	it.each([
		['the setting is off', () => jest.mocked(settings.get).mockImplementation((id) => id === 'MCP_Enabled')],
		['MCP is disabled', () => jest.mocked(settings.get).mockImplementation((id) => id === 'OAuth2_Allow_Dynamic_Client_Registration')],
		['the workspace lacks the AI add-on', () => jest.mocked(License.hasModule).mockReturnValue(false)],
	])('refuses to register while %s, and says why', async (_case, arrange) => {
		arrange();

		const result = await registerOAuthClient(claude);

		expect(result).toMatchObject({
			statusCode: 403,
			body: { error: 'access_denied', error_description: expect.stringContaining('not enabled') },
		});
		expect(OAuthApps.insertOne).not.toHaveBeenCalled();
	});

	it('checks the AI license module', async () => {
		await registerOAuthClient(claude);

		expect(License.hasModule).toHaveBeenCalledWith('chat.rocket.rc-ai');
	});

	it('creates an active OAuth app and returns its credentials', async () => {
		const result = await registerOAuthClient(claude);

		expect(result.statusCode).toBe(201);
		if (result.statusCode !== 201) {
			throw new Error('Expected the client to be registered');
		}
		expect(result.body).toMatchObject({
			client_id: expect.any(String),
			client_secret: expect.any(String),
			client_secret_expires_at: 0,
			client_name: 'Claude',
			redirect_uris: claude.redirect_uris,
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			token_endpoint_auth_method: 'client_secret_post',
		});
		expect(OAuthApps.insertOne).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Claude',
				active: true,
				clientId: result.body.client_id,
				clientSecret: result.body.client_secret,
				redirectUri: 'https://claude.ai/api/mcp/auth_callback',
			}),
		);
	});

	it('stores several redirect URIs in the comma-separated form the authorize endpoint reads', async () => {
		await registerOAuthClient({
			...claude,
			redirect_uris: ['http://127.0.0.1:33418/callback', 'cursor://anysphere.cursor-mcp/oauth/callback'],
		});

		expect(OAuthApps.insertOne).toHaveBeenCalledWith(
			expect.objectContaining({ redirectUri: 'http://127.0.0.1:33418/callback,cursor://anysphere.cursor-mcp/oauth/callback' }),
		);
	});

	// Every client of this server must authenticate at the token endpoint.
	it('issues a secret to a client that asks to be public', async () => {
		const result = await registerOAuthClient({ ...claude, token_endpoint_auth_method: 'none' });

		expect(result).toMatchObject({
			statusCode: 201,
			body: { client_secret: expect.any(String), token_endpoint_auth_method: 'client_secret_basic' },
		});
	});

	it('defaults to HTTP Basic client authentication', async () => {
		const { token_endpoint_auth_method: _, ...metadata } = claude;

		await expect(registerOAuthClient(metadata)).resolves.toMatchObject({ body: { token_endpoint_auth_method: 'client_secret_basic' } });
	});

	it('accepts the private-use scheme of a native app', async () => {
		await expect(registerOAuthClient({ ...claude, redirect_uris: ['com.example.app:/oauth/callback'] })).resolves.toMatchObject({
			statusCode: 201,
		});
	});

	it('names an unnamed native client after its redirect URI, within the name length limit', async () => {
		const { client_name: _, ...metadata } = claude;
		const redirectUri = `com.example.app:/${'x'.repeat(200)}`;

		const result = await registerOAuthClient({ ...metadata, redirect_uris: [redirectUri] });

		expect(result).toMatchObject({ statusCode: 201, body: { client_name: redirectUri.slice(0, 100) } });
	});

	it('names an unnamed client after its redirect host', async () => {
		const { client_name: _, ...metadata } = claude;

		await expect(registerOAuthClient(metadata)).resolves.toMatchObject({ body: { client_name: 'claude.ai' } });
	});

	it.each([
		['no redirect URIs', { redirect_uris: [] }],
		['a redirect URI that is not a string', { redirect_uris: [42] }],
		['a relative redirect URI', { redirect_uris: ['/callback'] }],
		['a plain http redirect URI outside loopback', { redirect_uris: ['http://client.example/callback'] }],
		['a redirect URI with a fragment', { redirect_uris: ['https://client.example/callback#done'] }],
		['a redirect URI containing a comma', { redirect_uris: ['https://client.example/callback?a=1,2'] }],
		['a javascript redirect URI', { redirect_uris: ['javascript:alert(1)'] }],
		['an ftp redirect URI', { redirect_uris: ['ftp://client.example/callback'] }],
		['a mailto redirect URI', { redirect_uris: ['mailto:someone@client.example'] }],
		['a websocket redirect URI', { redirect_uris: ['wss://client.example/callback'] }],
		['a redirect URI containing whitespace', { redirect_uris: ['https://client.example/call back'] }],
		['a redirect URI with a trailing newline', { redirect_uris: ['https://client.example/callback\n'] }],
		['too many redirect URIs', { redirect_uris: Array.from({ length: 11 }, (_, i) => `https://client.example/${i}`) }],
	])('rejects %s', async (_case, metadata) => {
		await expect(registerOAuthClient({ ...claude, ...metadata })).resolves.toMatchObject({
			statusCode: 400,
			body: { error: 'invalid_redirect_uri' },
		});
		expect(OAuthApps.insertOne).not.toHaveBeenCalled();
	});

	it.each([
		['an unsupported grant type', { grant_types: ['client_credentials'] }],
		['an unsupported response type', { response_types: ['token'] }],
		['an unsupported client authentication method', { token_endpoint_auth_method: 'private_key_jwt' }],
		['a client name longer than 100 characters', { client_name: 'x'.repeat(101) }],
	])('rejects %s', async (_case, metadata) => {
		await expect(registerOAuthClient({ ...claude, ...metadata })).resolves.toMatchObject({
			statusCode: 400,
			body: { error: 'invalid_client_metadata' },
		});
		expect(OAuthApps.insertOne).not.toHaveBeenCalled();
	});

	it('rejects a body that is not a JSON object', async () => {
		await expect(registerOAuthClient(undefined)).resolves.toMatchObject({ statusCode: 400 });
		await expect(registerOAuthClient([claude])).resolves.toMatchObject({ statusCode: 400 });
	});
});
