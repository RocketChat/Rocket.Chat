import { cssUrl } from './cssUrl';

// The value is rendered into a quoted CSS string, so it is contained when the
// string cannot be ended early: no unescaped quote and no line break.
const body = (value: string) => value.slice('url("'.length, -'")'.length);
const withoutEscapes = (value: string) => value.replace(/\\[\s\S]/g, '');

describe('cssUrl', () => {
	it('renders an http(s) URL as a quoted url() value', () => {
		expect(cssUrl('https://example.com/a.png')).toBe('url("https://example.com/a.png")');
		expect(cssUrl('http://example.com/a.png')).toBe('url("http://example.com/a.png")');
	});

	it('keeps a query string and an encoded path intact', () => {
		expect(cssUrl('https://example.com/a%20b.png?v=1&x=2')).toBe('url("https://example.com/a%20b.png?v=1&x=2")');
	});

	it('leaves a relative URL relative so it resolves against the document', () => {
		expect(cssUrl('/images/a.png')).toBe('url("/images/a.png")');
		expect(cssUrl('images/a.png')).toBe('url("images/a.png")');
		expect(cssUrl('//cdn.example.com/a.png')).toBe('url("//cdn.example.com/a.png")');
	});

	it('does not let the value close the url() and add declarations', () => {
		const value = cssUrl('https://example.com/a.png"); background: red; content: url("x');

		expect(value.startsWith('url("')).toBe(true);
		expect(value.endsWith('")')).toBe(true);
		expect(withoutEscapes(body(value))).not.toContain('"');
	});

	it('drops line breaks that would end the declaration', () => {
		const value = cssUrl('https://example.com/a.png\n} body { display: none; } .x {');

		expect(value).not.toContain('\n');
		expect(value).not.toContain('\r');
		expect(withoutEscapes(body(value))).not.toContain('"');
	});

	it('refuses a protocol the browser must not fetch', () => {
		expect(cssUrl('javascript:alert(1)')).toBe('none');
		expect(cssUrl('data:image/svg+xml,<svg/>')).toBe('none');
		expect(cssUrl('vbscript:msgbox')).toBe('none');
	});

	it('refuses a value that brings a scheme but does not parse', () => {
		expect(cssUrl('https://[invalid]')).toBe('none');
	});

	it('refuses an empty or blank value', () => {
		expect(cssUrl('')).toBe('none');
		expect(cssUrl('   ')).toBe('none');
		expect(cssUrl(undefined)).toBe('none');
	});
});
