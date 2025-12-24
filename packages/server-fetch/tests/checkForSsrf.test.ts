import * as ssrfModule from '../src/checkForSsrf';

describe('checkForSsrf', () => {
	let nslookupSpy: jest.SpyInstance;

	afterEach(() => {
		nslookupSpy?.mockRestore();
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

	it('returns false for restricted IPv6 addresses', async () => {
		const restrictedIps = ['::1', 'fe80::1', 'fc00::1234', 'ff02::1'];
		for (const ip of restrictedIps) {
			// eslint-disable-next-line no-await-in-loop
			expect(await ssrfModule.checkForSsrf(`[${ip}]`)).toBe(false);
			// eslint-disable-next-line no-await-in-loop
			expect(await ssrfModule.checkForSsrf(ip)).toBe(false);
		}
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
});
