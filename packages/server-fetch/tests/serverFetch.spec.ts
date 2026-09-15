import { serverFetch } from '../src/index';
import * as ssrfModule from '../src/checkForSsrf';
import fetch from 'node-fetch';

jest.mock('node-fetch', () => {
	const mockFetch = jest.fn();
	return {
		__esModule: true,
		default: mockFetch,
	};
});

jest.mock('../src/checkForSsrf', () => ({
	...jest.requireActual('../src/checkForSsrf'),
	checkForSsrfWithIp: jest.fn(),
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const checkForSsrfWithIpMock = ssrfModule.checkForSsrfWithIp as jest.MockedFunction<typeof ssrfModule.checkForSsrfWithIp>;

describe('serverFetch', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('restores SNI on redirects to pinned IP (prevents SSRF validation bypass and SNI failure)', async () => {
		const originalUrl = 'https://example.com:8443/api';
		const pinnedIp = '1.2.3.4';
		const redirectPath = '/foo';

		// Mock SSRF validation to always allow and resolve example.com to our pinned IP
		checkForSsrfWithIpMock.mockResolvedValue({
			allowed: true,
			resolvedIp: pinnedIp,
		});

		// Mock node-fetch
		mockFetch
			.mockResolvedValueOnce({
				status: 302,
				headers: {
					get: (key: string) => {
						if (key.toLowerCase() === 'location') {
							// Simulate node-fetch resolving the relative location against the pinned URL
							return `https://${pinnedIp}:8443${redirectPath}`;
						}
						return null;
					},
				},
				body: { resume: jest.fn() },
			} as any)
			.mockResolvedValueOnce({
				status: 200,
				headers: { get: () => null },
				body: { resume: jest.fn() },
			} as any);

		await serverFetch(originalUrl);

		expect(mockFetch).toHaveBeenCalledTimes(2);

		// First request should be directed to the pinned IP with the original hostname
		const firstCallUrl = mockFetch.mock.calls[0][0];
		const firstCallOptions = mockFetch.mock.calls[0][1];
		expect(firstCallUrl).toBe(`https://${pinnedIp}:8443/api`);
		expect(firstCallOptions?.headers).toHaveProperty('Host', 'example.com:8443');

		// Second request (after redirect) should ALSO be directed to the pinned IP
		// but MUST retain the original hostname and port (example.com:8443) for SNI/Host header
		const secondCallUrl = mockFetch.mock.calls[1][0];
		const secondCallOptions = mockFetch.mock.calls[1][1];
		expect(secondCallUrl).toBe(`https://${pinnedIp}:8443${redirectPath}`);
		expect(secondCallOptions?.headers).toHaveProperty('Host', 'example.com:8443');
	});
});
