import { GraphTokenClient, DEFAULT_AUTHORITY_HOST, DEFAULT_GRAPH_HOST } from './GraphTokenClient';
import { ExchangeError } from '../errors';

const serverFetch = jest.fn();

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: (...args: unknown[]) => serverFetch(...args),
}));

type FakeResponse = {
	ok: boolean;
	status: number;
	headers: { get: (name: string) => string | null };
	json: () => Promise<unknown>;
	text: () => Promise<string>;
};

const jsonResponse = (status: number, payload: unknown, headers: Record<string, string> = {}): FakeResponse => ({
	ok: status >= 200 && status < 300,
	status,
	headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
	json: async () => payload,
	text: async () => JSON.stringify(payload),
});

const config = {
	tenantId: 'contoso.onmicrosoft.com',
	clientId: 'client-id',
	clientSecret: 'client-secret',
};

describe('GraphTokenClient', () => {
	beforeEach(() => {
		serverFetch.mockReset();
		jest.useRealTimers();
	});

	describe('endpoint construction', () => {
		it('builds the v2.0 token endpoint for the tenant', () => {
			const client = new GraphTokenClient(config);
			expect(client.tokenEndpoint).toBe(`${DEFAULT_AUTHORITY_HOST}/contoso.onmicrosoft.com/oauth2/v2.0/token`);
		});

		it('uses the .default scope, not individual permission names', () => {
			const client = new GraphTokenClient(config);
			expect(client.scope).toBe(`${DEFAULT_GRAPH_HOST}/.default`);
		});

		it('honours a custom authority host without producing a double slash', () => {
			const client = new GraphTokenClient({ ...config, authorityHost: 'https://login.microsoftonline.us/' });
			expect(client.tokenEndpoint).toBe('https://login.microsoftonline.us/contoso.onmicrosoft.com/oauth2/v2.0/token');
		});

		it('falls back to the defaults when the hosts are empty strings', () => {
			const client = new GraphTokenClient({ ...config, authorityHost: '', graphHost: '' });

			expect(client.tokenEndpoint).toBe(`${DEFAULT_AUTHORITY_HOST}/contoso.onmicrosoft.com/oauth2/v2.0/token`);
			expect(client.scope).toBe(`${DEFAULT_GRAPH_HOST}/.default`);
			expect(client.allowList).toEqual(['login.microsoftonline.com', 'graph.microsoft.com']);
		});
	});

	describe('air gap', () => {
		it('exposes only the authority and graph hosts on the allowlist', () => {
			const client = new GraphTokenClient(config);
			expect(client.allowList).toEqual(['login.microsoftonline.com', 'graph.microsoft.com']);
		});

		it('enforces SSRF validation with an explicit allowlist instead of disabling it', async () => {
			serverFetch.mockResolvedValue(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			const client = new GraphTokenClient(config);
			await client.getAccessToken();

			const [, options] = serverFetch.mock.calls[0];
			expect(options.ignoreSsrfValidation).toBe(false);
			expect(options.allowList).toEqual(['login.microsoftonline.com', 'graph.microsoft.com']);
		});
	});

	describe('token request', () => {
		it('posts the client credentials grant form-encoded and the token is returned', async () => {
			serverFetch.mockResolvedValue(jsonResponse(200, { access_token: 'the-token', expires_in: 3600 }));

			const client = new GraphTokenClient(config);

			const token = await client.getAccessToken();
			await expect(token).resolves.toBe('the-token');

			const [url, options] = serverFetch.mock.calls[0];
			expect(url).toBe(client.tokenEndpoint);
			expect(options.method).toBe('POST');
			expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

			const body = options.body as URLSearchParams;
			expect(body.get('grant_type')).toBe('client_credentials');
			expect(body.get('client_id')).toBe('client-id');
			expect(body.get('client_secret')).toBe('client-secret');
			expect(body.get('scope')).toBe(`${DEFAULT_GRAPH_HOST}/.default`);
		});
	});

	describe('caching', () => {
		it('reuses a cached token instead of requesting a second one', async () => {
			serverFetch.mockResolvedValue(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			const client = new GraphTokenClient(config);
			await client.getAccessToken();
			await client.getAccessToken();

			expect(serverFetch).toHaveBeenCalledTimes(1);
		});

		it('refreshes 30 seconds before the server-stated expiry', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-08-21T10:00:00Z'));
			serverFetch.mockResolvedValue(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			const client = new GraphTokenClient(config);
			await client.getAccessToken();

			// One second before the safety margin kicks in: still cached.
			jest.setSystemTime(new Date('2026-08-21T10:59:29Z'));
			await client.getAccessToken();
			expect(serverFetch).toHaveBeenCalledTimes(1);

			// One second past it: refreshed, even though the server's own expiry has not arrived yet.
			jest.setSystemTime(new Date('2026-08-21T10:59:31Z'));
			await client.getAccessToken();
			expect(serverFetch).toHaveBeenCalledTimes(2);
		});

		it('collapses concurrent callers onto a single in-flight request', async () => {
			let release: (value: FakeResponse) => void = () => undefined;
			serverFetch.mockReturnValue(
				new Promise<FakeResponse>((resolve) => {
					release = resolve;
				}),
			);

			const client = new GraphTokenClient(config);
			const all = Promise.all([client.getAccessToken(), client.getAccessToken(), client.getAccessToken()]);

			release(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			await expect(all).resolves.toEqual(['tok', 'tok', 'tok']);
			expect(serverFetch).toHaveBeenCalledTimes(1);
		});

		it('drops the cached token when the configuration changes', async () => {
			serverFetch.mockResolvedValue(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			const client = new GraphTokenClient(config);
			await client.getAccessToken();

			client.updateConfig({ ...config, clientSecret: 'rotated' });
			await client.getAccessToken();

			expect(serverFetch).toHaveBeenCalledTimes(2);
			const body = serverFetch.mock.calls[1][1].body as URLSearchParams;
			expect(body.get('client_secret')).toBe('rotated');
		});
	});

	describe('failures', () => {
		it('refuses to call the network when settings are incomplete', async () => {
			const client = new GraphTokenClient({ ...config, clientSecret: '' });

			await expect(client.getAccessToken()).rejects.toMatchObject({ code: 'not-configured' });
			expect(serverFetch).not.toHaveBeenCalled();
		});

		it('reports rejected credentials as authentication-failed', async () => {
			serverFetch.mockResolvedValue(jsonResponse(401, { error: 'invalid_client' }));

			const client = new GraphTokenClient(config);
			await expect(client.getAccessToken()).rejects.toMatchObject({ code: 'authentication-failed' });
		});

		it('reports a response without an access_token as unexpected', async () => {
			serverFetch.mockResolvedValue(jsonResponse(200, { token_type: 'Bearer' }));

			const client = new GraphTokenClient(config);
			await expect(client.getAccessToken()).rejects.toMatchObject({ code: 'unexpected-response' });
		});

		it('does not cache a failed attempt', async () => {
			serverFetch.mockResolvedValueOnce(jsonResponse(401, { error: 'invalid_client' }));
			serverFetch.mockResolvedValueOnce(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }));

			const client = new GraphTokenClient(config);
			await expect(client.getAccessToken()).rejects.toBeInstanceOf(ExchangeError);
			await expect(client.getAccessToken()).resolves.toBe('tok');
		});
	});
});
