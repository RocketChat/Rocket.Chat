import { escapeHTML } from './escapeHTML';

describe('escapeHTML', () => {
	it('works', () => {
		expect(escapeHTML('<div>Blah & "blah" & \'blah\'</div>')).toBe(
			'&lt;div&gt;Blah &amp; &quot;blah&quot; &amp; &#39;blah&#39;&lt;/div&gt;',
		);
		expect(escapeHTML('&lt;')).toBe('&amp;lt;');
		expect(escapeHTML(' ')).toBe(' ');
		expect(escapeHTML('¢')).toBe('&cent;');
		expect(escapeHTML('¢ £ ¥ € © ® ™')).toBe('&cent; &pound; &yen; &euro; &copy; &reg; &trade;');
		expect(escapeHTML(5 as unknown as string)).toBe('5');
		expect(escapeHTML('')).toBe('');
		expect(escapeHTML(null as unknown as string)).toBe('');
		expect(escapeHTML(undefined as unknown as string)).toBe('');
	});
});
