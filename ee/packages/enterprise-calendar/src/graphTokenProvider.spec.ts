import { GraphTokenProvider } from './graphTokenProvider';
import type { GraphProviderConfiguration, HttpClient } from './types';

const configuration: GraphProviderConfiguration = {
	cloud: 'global',
	tenantId: '11111111-1111-4111-8111-111111111111',
	clientId: 'client',
	credential: { type: 'client-secret', clientSecret: 'do-not-log-this' },
};

const response = (status: number, value: unknown) => ({
	status,
	headers: { get: () => null },
	text: async () => JSON.stringify(value),
});

describe('GraphTokenProvider', () => {
	it('uses client credentials, .default, and caches the token', async () => {
		const http = jest.fn<HttpClient>().mockResolvedValue(response(200, { access_token: 'token', expires_in: 3600 }));
		const provider = new GraphTokenProvider(configuration, http, () => 1_000);
		expect(await Promise.all([provider.getToken(), provider.getToken()])).toEqual(['token', 'token']);
		expect(http).toHaveBeenCalledTimes(1);
		const [, request] = http.mock.calls[0];
		const body = new URLSearchParams(request.body);
		expect(body.get('grant_type')).toBe('client_credentials');
		expect(body.get('scope')).toBe('https://graph.microsoft.com/.default');
		expect(body.get('client_secret')).toBe('do-not-log-this');
	});

	it('refreshes before expiration and sanitizes token failures', async () => {
		let now = 1_000;
		const http = jest
			.fn<HttpClient>()
			.mockResolvedValueOnce(response(200, { access_token: 'first', expires_in: 301 }))
			.mockResolvedValueOnce(response(401, { error: 'invalid_client', error_description: 'contains secret detail' }));
		const provider = new GraphTokenProvider(configuration, http, () => now);
		expect(await provider.getToken()).toBe('first');
		now += 2_000;
		let failure: unknown;
		try {
			await provider.getToken();
		} catch (error) {
			failure = error;
		}
		expect(failure).toBeInstanceOf(Error);
		expect((failure as Error).message).toBe('Microsoft credential is invalid or expired');
		expect((failure as Error).message).not.toContain('contains secret detail');
	});
});
