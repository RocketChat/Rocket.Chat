import { sanitizeUrl } from './sanitizeUrl';

describe('allowed schemes', () => {
	it.each([
		['http', 'http://rocket.chat/docs', 'http://rocket.chat/docs'],
		['https', 'https://rocket.chat/docs', 'https://rocket.chat/docs'],
		['mailto', 'mailto:me@rocket.chat', 'mailto:me@rocket.chat'],
		['tel with a country code', 'tel:+15551234567', 'tel:+15551234567'],
		['tel with a national number', 'tel:07563546725', 'tel:07563546725'],
		['tel with a short number', 'tel:5551', 'tel:5551'],
	])('keeps a %s URL', (_label, href, expected) => {
		expect(sanitizeUrl(href)).toBe(expected);
	});

	it('reads the scheme case-insensitively', () => {
		expect(sanitizeUrl('HTTPS://ROCKET.CHAT/Docs')).toBe('https://rocket.chat/Docs');
	});

	it('keeps credentials the user typed', () => {
		expect(sanitizeUrl('http://user:pass@rocket.chat/')).toBe('http://user:pass@rocket.chat/');
	});

	it('keeps a query string untouched', () => {
		expect(sanitizeUrl('https://rocket.chat/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E')).toBe(
			'https://rocket.chat/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
		);
	});
});

describe('refused schemes', () => {
	it.each([
		['javascript', 'javascript:alert(1)'],
		['javascript in upper case', 'JAVASCRIPT:alert(1)'],
		['data', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
		['vbscript', 'vbscript:msgbox(1)'],
		['file', 'file:///etc/passwd'],
		['smb', 'smb://attacker.example/share'],
		['blob', 'blob:https://rocket.chat/2b1f'],
		['vscode', 'vscode://file/etc/passwd'],
		['ms-msdt', 'ms-msdt:/id'],
		['intent', 'intent://evil.example'],
		['jar', 'jar:http://evil.example/a.jar'],
		['ftp', 'ftp://evil.example/a.txt'],
	])('refuses a %s URL', (_label, href) => {
		expect(sanitizeUrl(href)).toBeUndefined();
	});

	it.each([
		['javascript', 'javascript:1/alert(1)'],
		['data', 'data:1'],
	])('refuses a %s URL shaped like a host and port', (_label, href) => {
		expect(sanitizeUrl(href)).toBeUndefined();
	});

	it('refuses a schemeless host with no dot, which would otherwise read as a scheme', () => {
		expect(sanitizeUrl('localhost:3000/admin')).toBeUndefined();
	});
});

describe('empty and blank input', () => {
	it.each([
		['an empty string', ''],
		['a single space', ' '],
		['only whitespace', '   '],
	])('refuses %s', (_label, href) => {
		expect(sanitizeUrl(href)).toBeUndefined();
	});
});

describe('root-relative paths', () => {
	it.each([
		['a plain path', '/admin'],
		['a path with a query and a fragment', '/admin/users?page=2#top'],
		['the site root', '/'],
	])('keeps %s as typed', (_label, href) => {
		expect(sanitizeUrl(href)).toBe(href);
	});

	it.each([
		['a backslash', '/\\evil.example'],
		['a second slash', '//evil.example'],
	])('does not treat a path starting with %s as root-relative', (_label, href) => {
		expect(sanitizeUrl(href)).not.toBe(href);
	});
});

describe('schemeless targets', () => {
	it.each([
		['a bare domain', 'rocket.chat', 'https://rocket.chat/'],
		['a bare domain with a path', 'rocket.chat/docs', 'https://rocket.chat/docs'],
		['a bare domain with a port', 'rocket.chat:8080', 'https://rocket.chat:8080/'],
		['an IP address with a port', '192.168.1.5:8080/admin', 'https://192.168.1.5:8080/admin'],
		['a protocol-relative URL', '//rocket.chat/docs', 'https://rocket.chat/docs'],
	])('resolves %s to an explicit https target', (_label, href, expected) => {
		expect(sanitizeUrl(href)).toBe(expected);
	});

	it('never returns a scheme-relative URL that would inherit the page scheme', () => {
		const sanitized = sanitizeUrl('rocket.chat/docs') ?? '';

		expect(sanitized.startsWith('//')).toBe(false);
		expect(new URL(sanitized).protocol).toBe('https:');
	});

	it.each([
		['as typed', 'evil.example\\@rocket.chat'],
		['as the parser emits it', '//evil.example\\@rocket.chat'],
	])('resolves the real host when a backslash is used to disguise it, %s', (_label, href) => {
		const sanitized = sanitizeUrl(href) ?? '';

		expect(new URL(sanitized).hostname).toBe('evil.example');
	});
});
