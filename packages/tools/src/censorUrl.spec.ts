import { censorUrl } from './censorUrl';

describe('censorUrl', () => {
	it('returns the original value when URL parsing fails', () => {
		const input = 'not-a-url';

		expect(censorUrl(input)).toBe(input);
	});

	it('redacts sensitive query parameters in relative URLs', () => {
		const input = '/path/to/resource?query=secret&access_token=token&foo=bar';

		expect(censorUrl(input)).toBe('/path/to/resource?query=*Redacted*&access_token=*Redacted*&foo=bar');
	});

	it('redacts path-relative URLs without a leading slash', () => {
		expect(censorUrl('users?token=secret')).toBe('users?token=*Redacted*');
		expect(censorUrl('next?token=secret')).toBe('next?token=*Redacted*');
		expect(censorUrl('api/v1/users?token=secret&foo=bar')).toBe('api/v1/users?token=*Redacted*&foo=bar');
	});

	it('redacts and preserves protocol-relative URLs', () => {
		expect(censorUrl('//example.com/path?token=secret')).toBe('//example.com/path?token=*Redacted*');
		expect(censorUrl('//user:pass@example.com/path?token=secret')).toBe(
			'//*Redacted*:*Redacted*@example.com/path?token=*Redacted*',
		);
	});

	it('redacts and preserves dot-relative URLs', () => {
		expect(censorUrl('./users?token=secret')).toBe('./users?token=*Redacted*');
		expect(censorUrl('../../users?token=secret&foo=bar')).toBe('../../users?token=*Redacted*&foo=bar');
	});

	it('preserves non-sensitive relative URLs without modification', () => {
		const input = '/path/to/resource?foo=bar&page=2';

		expect(censorUrl(input)).toBe('/path/to/resource?foo=bar&page=2');
	});

	it('redacts query-only relative URLs', () => {
		const input = '?token=secret123&foo=bar';

		expect(censorUrl(input)).toBe('?token=*Redacted*&foo=bar');
	});

	it('preserves hash anchors in relative URLs while redacting parameters', () => {
		const input = '/api/v1/users?token=secret123#profile';

		expect(censorUrl(input)).toBe('/api/v1/users?token=*Redacted*#profile');
	});

	it('does not change URLs without sensitive parts', () => {
		expect(censorUrl('https://example.com/path?foo=bar')).toBe('https://example.com/path?foo=bar');
	});

	it('redacts username and password from auth section', () => {
		expect(censorUrl('https://user:password@example.com/path')).toBe('https://*Redacted*:*Redacted*@example.com/path');
	});

	it('redacts only username when password is not present', () => {
		expect(censorUrl('https://user@example.com/path')).toBe('https://*Redacted*@example.com/path');
	});

	it('redacts query and access_token search params', () => {
		expect(censorUrl('https://example.com/path?query=secret&access_token=token&foo=bar')).toBe(
			'https://example.com/path?query=*Redacted*&access_token=*Redacted*&foo=bar',
		);
	});

	it('redacts access_token even when query is absent', () => {
		expect(censorUrl('https://example.com/path?access_token=token&foo=bar')).toBe(
			'https://example.com/path?access_token=*Redacted*&foo=bar',
		);
	});

	it('redacts additional sensitive parameters (token, secret, password, apiKey, auth_token, authorization, code)', () => {
		expect(
			censorUrl(
				'https://example.com/api?token=tok123&secret=sec456&password=pass789&apiKey=key0&auth_token=auth1&authorization=Bearer123&code=oauthcode&userId=user1',
			),
		).toBe(
			'https://example.com/api?token=*Redacted*&secret=*Redacted*&password=*Redacted*&apiKey=*Redacted*&auth_token=*Redacted*&authorization=*Redacted*&code=*Redacted*&userId=user1',
		);
	});

	it('redacts sensitive query parameters case-insensitively', () => {
		expect(censorUrl('https://example.com/api?TOKEN=tok123&PASSWORD=pass&ApiKey=key0&SECRET=sec')).toBe(
			'https://example.com/api?TOKEN=*Redacted*&PASSWORD=*Redacted*&ApiKey=*Redacted*&SECRET=*Redacted*',
		);
	});

	it('accepts URL objects as input', () => {
		expect(censorUrl(new URL('https://user:password@example.com/path?query=secret'))).toBe(
			'https://*Redacted*:*Redacted*@example.com/path?query=*Redacted*',
		);
	});

	it('does not modify the original URL object', () => {
		const input = new URL('https://user:password@example.com/path?query=secret&access_token=token');
		const originalValue = input.toString();

		expect(censorUrl(input)).toBe('https://*Redacted*:*Redacted*@example.com/path?query=*Redacted*&access_token=*Redacted*');
		expect(input.toString()).toBe(originalValue);
	});
});
