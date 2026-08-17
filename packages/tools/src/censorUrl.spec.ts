import { censorUrl } from './censorUrl';

describe('censorUrl', () => {
	it('returns the original value when URL parsing fails', () => {
		const input = 'not-a-url';

		expect(censorUrl(input)).toBe(input);
	});

	it('returns relative URLs unchanged when no base is provided', () => {
		const input = '/path/to/resource?query=secret&access_token=token';

		expect(censorUrl(input)).toBe(input);
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
