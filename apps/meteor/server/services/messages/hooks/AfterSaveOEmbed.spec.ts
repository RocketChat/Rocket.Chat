import { OEmbedCache } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';

import { isIgnoredHost, getUrlMetaWithCache, getUrlContent, getUrlMeta, OEmbed } from './AfterSaveOEmbed';
import { beforeGetUrlContent, afterParseUrlContent } from '../lib/oembed/providers';

const mockSettings = new Map<string, any>();

jest.mock('../../../settings', () => ({
	settings: {
		get: jest.fn((key: string) => mockSettings.get(key)),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	OEmbedCache: {
		findOneById: jest.fn(),
		createWithIdAndData: jest.fn(),
	},
	Messages: {
		setUrlsById: jest.fn(),
	},
}));

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: jest.fn(),
}));

jest.mock('../../../../rocketchat.info', () => ({
	Info: { version: '8.10.0' },
}));

jest.mock('../lib/oembed/providers', () => ({
	beforeGetUrlContent: jest.fn(({ urlObj }: { urlObj: URL }) => ({ urlObj })),
	afterParseUrlContent: jest.fn((data: unknown) => data),
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn(() => ({
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	})),
}));

describe('AfterSaveOEmbed', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSettings.clear();
		mockSettings.set('API_Embed', true);
		mockSettings.set('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, [::1], 2001:db8::/32, 10.0.0.0/8, 192.168.0.0/16, *.internal.net');
		mockSettings.set('API_EmbedSafePorts', '80, 443');

		(serverFetch as jest.Mock).mockResolvedValue({
			headers: new Map([['content-type', 'text/html']]),
			status: 200,
			body: [Buffer.from('<title>Example</title>')],
		});
	});

	describe('isIgnoredHost', () => {
		it('should return false when hostname is undefined or empty', () => {
			expect(isIgnoredHost(undefined)).toBe(false);
			expect(isIgnoredHost('')).toBe(false);
		});

		it('should return false when API_EmbedIgnoredHosts setting is empty', () => {
			mockSettings.set('API_EmbedIgnoredHosts', '');
			expect(isIgnoredHost('localhost')).toBe(false);
			expect(isIgnoredHost('127.0.0.1')).toBe(false);
		});

		it('should identify exact host matches case-insensitively', () => {
			expect(isIgnoredHost('localhost')).toBe(true);
			expect(isIgnoredHost('LOCALHOST')).toBe(true);
			expect(isIgnoredHost('LocalHost')).toBe(true);
		});

		it('should normalize trailing dots in hostnames', () => {
			expect(isIgnoredHost('localhost.')).toBe(true);
			expect(isIgnoredHost('127.0.0.1.')).toBe(true);
		});

		it('should identify IP addresses matching exact or CIDR ranges', () => {
			expect(isIgnoredHost('127.0.0.1')).toBe(true);
			expect(isIgnoredHost('10.0.5.23')).toBe(true);
			expect(isIgnoredHost('192.168.1.1')).toBe(true);
			expect(isIgnoredHost('8.8.8.8')).toBe(false);
		});

		it('should normalize IPv6 addresses and strip brackets', () => {
			expect(isIgnoredHost('[::1]')).toBe(true);
			expect(isIgnoredHost('::1')).toBe(true);
			expect(isIgnoredHost('[::1].')).toBe(true);
			expect(isIgnoredHost('[2001:db8::1]')).toBe(true);
			expect(isIgnoredHost('2001:db8::1')).toBe(true);
			expect(isIgnoredHost('[2001:db9::1]')).toBe(false);
		});

		it('should match wildcard patterns', () => {
			expect(isIgnoredHost('service.internal.net')).toBe(true);
			expect(isIgnoredHost('api.internal.net')).toBe(true);
			expect(isIgnoredHost('sub.internal.net')).toBe(true);
			expect(isIgnoredHost('service.external.net')).toBe(false);
		});

		it('should return false for hosts not on the blocklist', () => {
			expect(isIgnoredHost('rocket.chat')).toBe(false);
			expect(isIgnoredHost('github.com')).toBe(false);
			expect(isIgnoredHost('example.com')).toBe(false);
		});
	});

	describe('getUrlMetaWithCache (Issue #3207: Cached URL embed ignores blocklist)', () => {
		it('should return undefined and bypass cache query when the URL host is ignored', async () => {
			const ignoredUrl = 'https://localhost/api/test';

			// Mock cache having pre-existing cached data from before the host was ignored
			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: ignoredUrl,
				data: {
					headers: {},
					meta: { pageTitle: 'Should never be returned' },
				},
			});

			const result = await getUrlMetaWithCache(ignoredUrl);

			expect(result).toBeUndefined();
			expect(OEmbedCache.findOneById).not.toHaveBeenCalled();
		});

		it('should return undefined when a wildcard-matching host URL is queried even if cached', async () => {
			const wildcardUrl = 'https://portal.internal.net/dashboard';

			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: wildcardUrl,
				data: {
					headers: {},
					meta: { pageTitle: 'Internal Dashboard' },
				},
			});

			const result = await getUrlMetaWithCache(wildcardUrl);

			expect(result).toBeUndefined();
			expect(OEmbedCache.findOneById).not.toHaveBeenCalled();
		});

		it('should return cached metadata when the URL host is not on the ignore list', async () => {
			const allowedUrl = 'https://rocket.chat/press';
			const cachedData = {
				headers: { contentType: 'text/html' },
				meta: { pageTitle: 'Rocket.Chat Press & Media' },
			};

			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: allowedUrl,
				data: cachedData,
			});

			const result = await getUrlMetaWithCache(allowedUrl);

			expect(OEmbedCache.findOneById).toHaveBeenCalledWith(allowedUrl);
			expect(result).toEqual(cachedData);
		});

		it('should return undefined when cached data points to an ignored redirect target URL', async () => {
			const publicShortlink = 'https://short.link/123';
			const cachedRedirectData = {
				url: 'http://localhost/internal-secret',
				headers: { contentType: 'text/html' },
				meta: { pageTitle: 'Internal Secret Admin' },
			};

			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: publicShortlink,
				data: cachedRedirectData,
			});

			const result = await getUrlMetaWithCache(publicShortlink);

			expect(OEmbedCache.findOneById).toHaveBeenCalledWith(publicShortlink);
			expect(result).toBeUndefined();
		});

		it('should return undefined gracefully for malformed URLs without throwing', async () => {
			const malformedUrl = 'not-a-valid-url';

			const result = await getUrlMetaWithCache(malformedUrl);

			expect(result).toBeUndefined();
			expect(OEmbedCache.findOneById).not.toHaveBeenCalled();
		});

		it('should return undefined if cached entry points to an unsafe port', async () => {
			const cachedUrl = 'https://short.link/unsafe-port';
			(OEmbedCache.findOneById as jest.Mock).mockResolvedValueOnce({
				_id: cachedUrl,
				data: {
					url: 'https://allowed-host.com:22/ssh',
					meta: { pageTitle: 'SSH Admin' },
				},
			});

			const result = await getUrlMetaWithCache(cachedUrl);
			expect(result).toBeUndefined();
		});

		it('should return undefined without querying cache if requested URL is on an unsafe port', async () => {
			const unsafePortUrl = 'http://example.com:22/admin';
			const result = await getUrlMetaWithCache(unsafePortUrl);

			expect(result).toBeUndefined();
			expect(OEmbedCache.findOneById).not.toHaveBeenCalled();
		});

		it('should return undefined if cached target URL is malformed', async () => {
			const cachedUrl = 'https://short.link/malformed';
			(OEmbedCache.findOneById as jest.Mock).mockResolvedValueOnce({
				_id: cachedUrl,
				data: {
					url: 'not-a-valid-url',
					meta: { pageTitle: 'Bad' },
				},
			});

			const result = await getUrlMetaWithCache(cachedUrl);
			expect(result).toBeUndefined();
		});
	});

	describe('OEmbed.parseUrl', () => {
		it('should return foundMeta: false for ignored host URLs even if cache exists', async () => {
			const ignoredUrl = 'http://127.0.0.1:3000/status';

			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: ignoredUrl,
				data: {
					headers: {},
					meta: { pageTitle: 'Server Status' },
				},
			});

			const result = await OEmbed.parseUrl(ignoredUrl);

			expect(result).toEqual({
				urlPreview: { url: ignoredUrl, meta: {} },
				foundMeta: false,
			});
			expect(OEmbedCache.findOneById).not.toHaveBeenCalled();
		});

		it('should return foundMeta: true with preview for allowed cached URLs', async () => {
			const allowedUrl = 'https://github.com/RocketChat/Rocket.Chat';
			const cachedData = {
				url: allowedUrl,
				headers: { contentType: 'text/html', contentLength: '1024' },
				meta: { pageTitle: 'Rocket.Chat GitHub Repo', description: 'Open Source Communications' },
			};

			(OEmbedCache.findOneById as jest.Mock).mockResolvedValue({
				_id: allowedUrl,
				data: cachedData,
			});

			const result = await OEmbed.parseUrl(allowedUrl);

			expect(result.foundMeta).toBe(true);
			expect(result.urlPreview.meta).toEqual(
				expect.objectContaining({
					pageTitle: 'Rocket.Chat GitHub Repo',
					description: 'Open Source Communications',
				}),
			);
			expect(OEmbedCache.findOneById).toHaveBeenCalledWith(allowedUrl);
		});
	});

	describe('getUrlContent (SSRF & Redirect Protection)', () => {
		it('should throw "host is ignored" when urlObj hostname is on the ignore list', async () => {
			const ignoredUrlObj = new URL('http://localhost/private');
			await expect(getUrlContent(ignoredUrlObj)).rejects.toThrow('host is ignored');
		});

		it('should throw "host is ignored" when urlObj is an IPv6 bracketed address on the ignore list', async () => {
			const ipv6UrlObj = new URL('http://[::1]:80/status');
			await expect(getUrlContent(ipv6UrlObj)).rejects.toThrow('host is ignored');
		});

		it('should throw "host is ignored" if beforeGetUrlContent rewrites urlObj to an ignored host', async () => {
			const publicUrlObj = new URL('http://allowed-host.com/proxy');
			(beforeGetUrlContent as jest.Mock).mockReturnValueOnce({
				urlObj: new URL('http://127.0.0.1/internal'),
			});

			await expect(getUrlContent(publicUrlObj)).rejects.toThrow('host is ignored');
		});

		it('should throw "invalid/unsafe port" if beforeGetUrlContent rewrites urlObj to an unsafe port', async () => {
			const publicUrlObj = new URL('http://allowed-host.com/proxy');
			(beforeGetUrlContent as jest.Mock).mockReturnValueOnce({
				urlObj: new URL('http://allowed-host.com:22/ssh'),
			});

			await expect(getUrlContent(publicUrlObj)).rejects.toThrow('invalid/unsafe port');
		});

		it('should not throw "invalid/unsafe port" when API_EmbedSafePorts is empty string', async () => {
			mockSettings.set('API_EmbedSafePorts', '');
			const publicUrlObj = new URL('http://allowed-host.com:9000/api');
			await expect(getUrlContent(publicUrlObj)).resolves.toBeDefined();
		});
		it('should reject redirect if onRedirect target is on an ignored host', async () => {
			(serverFetch as jest.Mock).mockImplementationOnce(async (_url, options) => {
				if (options?.onRedirect) {
					options.onRedirect(new URL('http://127.0.0.1/internal'));
				}
				return {
					headers: new Map([['content-type', 'text/html']]),
					status: 200,
					body: [Buffer.from('<title>Redirect</title>')],
				};
			});

			const publicUrlObj = new URL('http://allowed-host.com/shortlink');
			await expect(getUrlContent(publicUrlObj)).rejects.toThrow('host is ignored');
		});

		it('should reject redirect if onRedirect target is on an unsafe port', async () => {
			(serverFetch as jest.Mock).mockImplementationOnce(async (_url, options) => {
				if (options?.onRedirect) {
					options.onRedirect(new URL('http://allowed-host.com:22/ssh'));
				}
				return {
					headers: new Map([['content-type', 'text/html']]),
					status: 200,
					body: [Buffer.from('<title>Redirect</title>')],
				};
			});

			const publicUrlObj = new URL('http://allowed-host.com/shortlink');
			await expect(getUrlContent(publicUrlObj)).rejects.toThrow('invalid/unsafe port');
		});

		it('should return effective response.url in content.urlObj on redirect', async () => {
			(serverFetch as jest.Mock).mockResolvedValueOnce({
				headers: new Map([['content-type', 'text/html']]),
				status: 200,
				body: [Buffer.from('<title>Redirected Target</title>')],
				url: 'https://final-destination.com/article',
			});

			const publicUrlObj = new URL('https://short.link/123');
			const content = await getUrlContent(publicUrlObj);
			expect(content.urlObj.toString()).toBe('https://final-destination.com/article');
		});
	});

	describe('getUrlMeta', () => {
		it('should return undefined when getUrlContent throws host is ignored', async () => {
			const result = await getUrlMeta('http://localhost/secret');
			expect(result).toBeUndefined();
		});

		it('should persist effective target url from response.url in metadata', async () => {
			(serverFetch as jest.Mock).mockResolvedValueOnce({
				headers: new Map([['content-type', 'text/html']]),
				status: 200,
				body: [Buffer.from('<title>Final Article</title>')],
				url: 'https://final-destination.com/article',
			});

			const result = (await getUrlMeta('https://short.link/123')) as any;
			expect(result).toBeDefined();
			expect(result.url).toBe('https://final-destination.com/article');
		});

		it('should not mutate passed parsedUrl when withFragment is true', async () => {
			const urlObj = new URL('https://rocket.chat/page');
			await getUrlMeta('https://rocket.chat/page', true, urlObj);
			expect(urlObj.searchParams.has('_escaped_fragment_')).toBe(false);
		});

		it('should pass original url to afterParseUrlContent for provider detection and update returned url with effectiveUrl', async () => {
			(serverFetch as jest.Mock).mockResolvedValueOnce({
				headers: new Map([['content-type', 'application/json']]),
				status: 200,
				body: [Buffer.from('{"title":"Song Title"}')],
				url: 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/12345',
			});

			const originalUrl = 'https://open.spotify.com/track/12345';
			const result = (await getUrlMeta(originalUrl)) as any;
			expect(result).toBeDefined();
			expect(afterParseUrlContent).toHaveBeenCalledWith(
				expect.objectContaining({
					url: originalUrl,
				}),
			);
			expect(result.url).toBe('https://open.spotify.com/oembed?url=https://open.spotify.com/track/12345');
		});
	});
});
