import { VirtruClient } from './VirtruClient';

const serverFetchMock = jest.fn();
jest.mock('@rocket.chat/server-fetch', () => ({ serverFetch: (...a: unknown[]) => serverFetchMock(...a) }));

const cfg = {
	baseUrl: 'http://pdp',
	clientId: 'cid',
	clientSecret: 'sec',
	oidcEndpoint: 'http://oidc',
	defaultEntityKey: 'emailAddress' as const,
	attributeNamespace: 'example.com',
};

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => '' });

beforeEach(() => serverFetchMock.mockReset());

describe('VirtruClient', () => {
	it('caches the OIDC token across apiCalls (one token fetch serves many calls)', async () => {
		serverFetchMock.mockResolvedValueOnce(okJson({ access_token: 'tok', expires_in: 3600 })).mockResolvedValue(okJson({}));
		const c = new VirtruClient(cfg);
		await c.apiCall('/x', {});
		await c.apiCall('/y', {});
		const tokenCalls = serverFetchMock.mock.calls.filter(([url]) => String(url).includes('openid-connect/token'));
		expect(tokenCalls).toHaveLength(1);
	});

	it('updateConfig resets the token cache', async () => {
		serverFetchMock.mockResolvedValue(okJson({ access_token: 'tok', expires_in: 3600 }));
		const c = new VirtruClient(cfg);
		await c.apiCall('/x', {});
		c.updateConfig({ ...cfg, clientSecret: 'new' });
		await c.apiCall('/x', {});
		const tokenCalls = serverFetchMock.mock.calls.filter(([url]) => String(url).includes('openid-connect/token'));
		expect(tokenCalls).toHaveLength(2);
	});

	it('isAvailable true only when /healthz status SERVING', async () => {
		const c = new VirtruClient(cfg);
		serverFetchMock.mockResolvedValueOnce(okJson({ status: 'SERVING' }));
		expect(await c.isAvailable()).toBe(true);
		serverFetchMock.mockResolvedValueOnce(okJson({ status: 'NOT_SERVING' }));
		expect(await c.isAvailable()).toBe(false);
		serverFetchMock.mockRejectedValueOnce(new Error('down'));
		expect(await c.isAvailable()).toBe(false);
	});

	it('apiCall sends Bearer token', async () => {
		serverFetchMock.mockResolvedValueOnce(okJson({ access_token: 'tok', expires_in: 3600 })).mockResolvedValueOnce(okJson({}));
		const c = new VirtruClient(cfg);
		await c.apiCall('/x', {});
		const apiCallArgs = serverFetchMock.mock.calls.find(([url]) => String(url) === 'http://pdp/x');
		expect((apiCallArgs?.[1] as any).headers.Authorization).toBe('Bearer tok');
	});

	it('getClientTokenForHealthCheck resets the cache then returns a freshly fetched token', async () => {
		serverFetchMock
			.mockResolvedValueOnce(okJson({ access_token: 'tok1', expires_in: 3600 }))
			.mockResolvedValueOnce(okJson({}))
			.mockResolvedValueOnce(okJson({ access_token: 'tok2', expires_in: 3600 }));
		const c = new VirtruClient(cfg);
		await c.apiCall('/x', {});
		const token = await c.getClientTokenForHealthCheck();
		expect(token).toBe('tok2');
		const tokenCalls = serverFetchMock.mock.calls.filter(([url]) => String(url).includes('openid-connect/token'));
		expect(tokenCalls).toHaveLength(2);
	});

	it('getConfig exposes only baseUrl, defaultEntityKey, attributeNamespace and clientId', () => {
		const c = new VirtruClient(cfg);
		const pub = c.getConfig();
		expect(pub).toEqual({
			baseUrl: cfg.baseUrl,
			defaultEntityKey: cfg.defaultEntityKey,
			attributeNamespace: cfg.attributeNamespace,
			clientId: cfg.clientId,
		});
		expect(pub).not.toHaveProperty('clientSecret');
		expect(pub).not.toHaveProperty('oidcEndpoint');
	});

	it('apiCall throws on non-ok response', async () => {
		serverFetchMock
			.mockResolvedValueOnce(okJson({ access_token: 'tok', expires_in: 3600 }))
			.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });
		const c = new VirtruClient(cfg);
		await expect(c.apiCall('/x', {})).rejects.toThrow('Virtru PDP call failed');
	});
});
