import { censorUrl } from './censorUrl';

describe('censorUrl', () => {
	describe('URLs without credentials', () => {
		test.each([
			['https://example.com', 'https://example.com/'],
			['https://example.com/path', 'https://example.com/path'],
			['https://example.com/path?query=1', 'https://example.com/path?query=1'],
			['https://example.com/path?query=1#hash', 'https://example.com/path?query=1#hash'],
			['http://localhost:3000', 'http://localhost:3000/'],
		])('should return URL unchanged when no credentials present (%s)', (input, expected) => {
			expect(censorUrl(input)).toBe(expected);
		});
	});

	describe('URLs with password only', () => {
		it('should censor the password', () => {
			expect(censorUrl('https://:password@example.com')).toBe('https://:****@example.com/');
		});
	});

	describe('URLs with username only', () => {
		it('should censor the username', () => {
			expect(censorUrl('https://user@example.com')).toBe('https://****@example.com/');
		});
	});

	describe('URLs with username and password', () => {
		test.each([
			['https://user:password@example.com', 'https://****:****@example.com/'],
			['https://user:password@example.com/path', 'https://****:****@example.com/path'],
			['https://user:password@example.com/path?query=1', 'https://****:****@example.com/path?query=1'],
			['http://admin:secret@localhost:3000', 'http://****:****@localhost:3000/'],
			['ftp://user:pass@ftp.example.com/file.txt', 'ftp://****:****@ftp.example.com/file.txt'],
		])('should censor both username and password (%s)', (input, expected) => {
			expect(censorUrl(input)).toBe(expected);
		});
	});

	describe('invalid URLs', () => {
		test.each([['not-a-url'], [''], ['just some text'], ['user:password@example.com']])(
			'should return original string for invalid URL (%s)',
			(input) => {
				expect(censorUrl(input)).toBe(input);
			},
		);
	});
});
