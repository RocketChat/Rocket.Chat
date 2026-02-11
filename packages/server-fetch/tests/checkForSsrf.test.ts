import * as ssrfModule from '../src/checkForSsrf';
import { isIpInCidrRange } from '../src/checkForSsrfHelpers';

describe('checkForSsrf', () => {
	let nslookupSpy: jest.SpyInstance;

	afterEach(() => {
		nslookupSpy?.mockRestore();
		ssrfModule.setSsrfAllowlist([]);
	});

	it('returns false if URL does not start with http:// or https://', async () => {
		expect(await ssrfModule.checkForSsrf('ftp://example.com')).toBe(false);
	});

	it('returns false if domain is invalid', async () => {
		expect(await ssrfModule.checkForSsrf('https://invalid_domain')).toBe(false);
	});

	it('returns false if IPv4 is invalid', async () => {
		expect(await ssrfModule.checkForSsrf('https://127.1')).toBe(false);
	});

	it('returns false if IPv4 is restricted', async () => {
		expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(false);
	});

	it('returns false if domain is metadata.google.internal', async () => {
		expect(await ssrfModule.checkForSsrf('http://metadata.google.internal')).toBe(false);
	});

	it('returns false if DNS resolves to restricted IPv4', async () => {
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue('127.0.0.1');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('returns true if DNS resolves to public IPv4', async () => {
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue('216.58.214.174');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(true);
	});

	it('returns true if valid public IPv4 address', async () => {
		expect(await ssrfModule.checkForSsrf('http://216.58.214.174')).toBe(true);
	});

	it('returns true if valid URL resolves to public IPv4', async () => {
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue('216.58.214.174');
		const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/2560px-Cat_August_2010-4.jpg';
		expect(await ssrfModule.checkForSsrf(url)).toBe(true);
	});

	it('returns true for valid public IPv6 addresses', async () => {
		const publicIp = '2a00:1450:4007:806::200e';
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue(publicIp);
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(true);
		expect(await ssrfModule.checkForSsrf(`[${publicIp}]`)).toBe(true);
		expect(await ssrfModule.checkForSsrf(publicIp)).toBe(true);
	});

	it('returns false if DNS resolves to restricted IPv6', async () => {
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue('::1');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('returns true if DNS resolves to public IPv6', async () => {
		const publicIp = '2a00:1450:4007:806::200e';
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue(publicIp);
		expect(await ssrfModule.checkForSsrf('https://[2a00:1450:4007:806::200e]')).toBe(true);
	});

	it('returns false for invalid IPv6 format', async () => {
		expect(await ssrfModule.checkForSsrf('http://[gggg::1]')).toBe(false);
	});

	it('returns false if DNS resolution fails', async () => {
		nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockRejectedValue(new Error('DNS fail'));
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('handles bracketed and unbracketed IPv6 correctly', async () => {
		const ip = '2606:4700:4700::1111';
		expect(await ssrfModule.checkForSsrf(`[${ip}]`)).toBe(true);
		expect(await ssrfModule.checkForSsrf(ip)).toBe(true);
	});

	describe('restricted IPv6 addresses', () => {
		test.each(['::1', 'fe80::1', 'fc00::1234', 'ff02::1'])('returns false for restricted IPv6 address %s', async (ip) => {
			expect(await ssrfModule.checkForSsrf(`[${ip}]`)).toBe(false);
			expect(await ssrfModule.checkForSsrf(ip)).toBe(false);
		});
	});

	describe('allowlist', () => {
		it('allows allowlisted private IPv4', async () => {
			ssrfModule.setSsrfAllowlist(['127.0.0.1']);
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(true);
		});

		it('allows allowlisted private IPv4 with port', async () => {
			ssrfModule.setSsrfAllowlist(['192.168.1.1:8080']);
			expect(await ssrfModule.checkForSsrf('http://192.168.1.1:8080')).toBe(true);
		});

		it('allows allowlisted private IPv6', async () => {
			ssrfModule.setSsrfAllowlist(['[::1]']);
			expect(await ssrfModule.checkForSsrf('http://[::1]')).toBe(true);
		});

		it('allows allowlisted domain that resolves to private IP', async () => {
			nslookupSpy = jest.spyOn(ssrfModule, 'nslookup').mockResolvedValue('10.0.0.1');
			ssrfModule.setSsrfAllowlist(['internal.corp']);
			expect(await ssrfModule.checkForSsrf('http://internal.corp')).toBe(true);
		});

		it('denies same host when allowlist is cleared', async () => {
			ssrfModule.setSsrfAllowlist(['127.0.0.1']);
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(true);
			ssrfModule.setSsrfAllowlist([]);
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(false);
		});
	});
});

describe('isIpInCidrRange (IPv4-mapped IPv6)', () => {
	it('parses IPv4-mapped address correctly so prefix > 96 works', () => {
		// ::ffff:192.168.1.1 should be in ::ffff:192.168.0.0/112 but not in ::ffff:10.0.0.0/112
		expect(isIpInCidrRange('::ffff:192.168.1.1', '::ffff:192.168.0.0/112')).toBe(true);
		expect(isIpInCidrRange('::ffff:192.168.1.1', '::ffff:10.0.0.0/112')).toBe(false);
	});
});
