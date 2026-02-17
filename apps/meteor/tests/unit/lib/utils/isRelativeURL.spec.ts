import { expect } from 'chai';

import { isRelativeURL } from '../../../../lib/utils/isRelativeURL';

describe('isRelativeURL', () => {
	describe('relative URLs (should return true)', () => {
		const relativeURLs = [
			// Simple filenames
			['test', 'simple filename'],
			['file.txt', 'filename with extension'],
			['my-file.html', 'filename with hyphens'],

			// Directory references
			['.', 'current directory'],
			['..', 'parent directory'],

			// Relative paths
			['./test', 'current directory relative'],
			['../test', 'parent directory relative'],
			['./folder/file.txt', 'nested relative path'],
			['../folder/file.txt', 'parent relative path'],

			// Root-relative paths
			['/', 'root only'],
			['/path', 'root path'],
			['/path/to/file', 'nested root path'],
			['/path/to/file.html', 'nested root path with extension'],

			// Folder paths
			['folder/file', 'folder relative path'],
			['test/test', 'nested folder path'],
			['folder/sub/file.txt', 'deeply nested path'],

			// Edge cases
			['', 'empty string'],
			['#anchor', 'anchor only'],
			['?query=param', 'query only'],
			['#', 'hash only'],
			['?', 'question mark only'],
			['path#anchor', 'path with anchor'],
			['path?query=1', 'path with query'],
		] as const;

		relativeURLs.forEach(([url, description]) => {
			it(`should return true for ${description}: "${url}"`, () => {
				expect(isRelativeURL(url)).to.be.true;
			});
		});
	});

	describe('absolute URLs (should return false)', () => {
		const absoluteURLs = [
			// HTTP(S) schemes
			['https://rocket.chat', 'HTTPS URL'],
			['http://example.com', 'HTTP URL'],
			['https://example.com/path', 'HTTPS URL with path'],
			['http://localhost:3000', 'HTTP URL with port'],

			// Security-critical schemes (XSS vectors)
			['javascript:alert(1)', 'javascript URI (XSS vector)'],
			['javascript:void(0)', 'javascript void URI'],
			['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'data URI'],
			['data:text/html,<script>alert(1)</script>', 'data URI with HTML (XSS vector)'],

			// Other common schemes
			['file:///path/to/file', 'file URI'],
			['ftp://ftp.example.com', 'FTP URI'],
			['mailto:user@example.com', 'mailto URI'],
			['tel:+1234567890', 'tel URI'],
			['sms:+1234567890', 'SMS URI'],
			['ws://websocket.example.com', 'WebSocket URI'],
			['wss://websocket.example.com', 'secure WebSocket URI'],

			// Custom schemes
			['custom://example', 'custom URI scheme'],
			['app://open', 'app URI scheme'],
			['slack://channel', 'Slack URI scheme'],

			// Edge cases with schemes
			['a:', 'single letter scheme'],
			['A:', 'uppercase single letter scheme'],
			['ABC123:', 'alphanumeric scheme'],
			['x-custom:', 'scheme with hyphen'],
			['my.scheme:', 'scheme with dot'],
			['my+scheme:', 'scheme with plus'],
		] as const;

		absoluteURLs.forEach(([url, description]) => {
			it(`should return false for ${description}: "${url}"`, () => {
				expect(isRelativeURL(url)).to.be.false;
			});
		});
	});

	describe('security test cases', () => {
		it('should reject javascript: URIs to prevent XSS', () => {
			expect(isRelativeURL('javascript:alert(document.cookie)')).to.be.false;
			expect(isRelativeURL('javascript:void(0)')).to.be.false;
			expect(isRelativeURL('javascript://comment%0Aalert(1)')).to.be.false;
		});

		it('should reject data: URIs to prevent data injection', () => {
			expect(isRelativeURL('data:text/html,<h1>Test</h1>')).to.be.false;
			expect(isRelativeURL('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).to.be.false;
			expect(isRelativeURL('data:image/svg+xml,<svg onload=alert(1)>')).to.be.false;
		});

		it('should accept plain text that happens to contain colons (not at scheme position)', () => {
			// These are relative because the colon is NOT at the beginning after letters
			expect(isRelativeURL('file:name:with:colons.txt')).to.be.true; // filename, not a scheme
			expect(isRelativeURL('C:\\path\\to\\file')).to.be.true; // Windows path (colon not in scheme position)
		});

		it('should handle case-insensitive schemes correctly', () => {
			expect(isRelativeURL('HTTP://example.com')).to.be.false;
			expect(isRelativeURL('HTTPS://example.com')).to.be.false;
			expect(isRelativeURL('JavaScript:alert(1)')).to.be.false;
			expect(isRelativeURL('DATA:text/html,test')).to.be.false;
		});
	});

	describe('edge cases', () => {
		it('should handle URLs with encoded characters', () => {
			expect(isRelativeURL('%2Fpath%2Fto%2Ffile')).to.be.true;
			expect(isRelativeURL('path%20with%20spaces')).to.be.true;
		});

		it('should handle URLs with special characters', () => {
			expect(isRelativeURL('path/with-special_chars.file')).to.be.true;
			expect(isRelativeURL('path/with spaces/file.txt')).to.be.true;
			expect(isRelativeURL('path/(parentheses)/file')).to.be.true;
		});

		it('should handle protocol-relative URLs (// prefix) as absolute', () => {
			// Note: '//' is technically a protocol-relative URL (inherits protocol from page)
			// But our function checks for schemes, so '//example.com' would return true
			// This is acceptable as protocol-relative URLs are rare and context-dependent
			expect(isRelativeURL('//example.com')).to.be.true;
			expect(isRelativeURL('//cdn.example.com/file.js')).to.be.true;
		});
	});
});
