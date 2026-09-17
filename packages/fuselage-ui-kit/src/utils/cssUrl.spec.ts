import { cssUrl } from './cssUrl';

describe('cssUrl', () => {
	it('renders an http(s) URL as a quoted url() value', () => {
		expect(cssUrl('https://example.com/a.png')).toBe('url("https://example.com/a.png")');
		expect(cssUrl('http://example.com/a.png')).toBe('url("http://example.com/a.png")');
	});

	it('keeps a query string and an encoded path intact', () => {
		expect(cssUrl('https://example.com/a%20b.png?v=1&x=2')).toBe('url("https://example.com/a%20b.png?v=1&x=2")');
	});

	it('does not let the value close the url() and add declarations', () => {
		const value = cssUrl('https://example.com/a.png"); background: red; content: url("x');
		expect(value.startsWith('url("')).toBe(true);
		expect(value.endsWith('")')).toBe(true);
		expect(value).not.toContain('background: red');
		expect(value.slice(5, -2)).not.toContain('"');
	});

	it('refuses a protocol the browser must not fetch', () => {
		expect(cssUrl('javascript:alert(1)')).toBe('none');
		expect(cssUrl('data:image/svg+xml,<svg/>')).toBe('none');
		expect(cssUrl('vbscript:msgbox')).toBe('none');
	});

	it('refuses an empty or unparsable value', () => {
		expect(cssUrl('')).toBe('none');
		expect(cssUrl(undefined)).toBe('none');
	});

	it('drops line breaks that would end the declaration', () => {
		const value = cssUrl('https://example.com/a.png\n} body { display: none; } .x {');
		expect(value).not.toContain('\n');
		expect(value).not.toContain('display: none');
	});
});
