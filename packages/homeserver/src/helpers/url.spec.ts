import { describe, expect, it } from 'bun:test';
import { extractURIfromURL } from './url';

describe('extractURIfromURL', () => {
	it('should extract the URI from a URL with pathname and search params', () => {
		const url = new URL('https://example.com/path/to/resource?query=123');
		const result = extractURIfromURL(url);
		expect(result).toBe('/path/to/resource?query=123');
	});

	it('should extract the URI from a URL with only pathname', () => {
		const url = new URL('https://example.com/path/to/resource');
		const result = extractURIfromURL(url);
		expect(result).toBe('/path/to/resource');
	});

	it('should extract the URI from a URL with only search params', () => {
		const url = new URL('https://example.com/?query=123');
		const result = extractURIfromURL(url);
		expect(result).toBe('/?query=123');
	});

	it('should extract the URI from a URL with no pathname and no search params', () => {
		const url = new URL('https://example.com/');
		const result = extractURIfromURL(url);
		expect(result).toBe('/');
	});

	it('should handle URLs with special characters in pathname and search params', () => {
		const url = new URL(
			'https://example.com/path/to/resource%20with%20spaces?query=123&another=456',
		);
		const result = extractURIfromURL(url);
		expect(result).toBe(
			'/path/to/resource%20with%20spaces?query=123&another=456',
		);
	});
});
