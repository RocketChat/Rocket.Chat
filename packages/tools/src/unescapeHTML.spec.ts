import { unescapeHTML } from './unescapeHTML';

describe('unescapeHTML', () => {
	it('works', () => {
		expect(unescapeHTML('&lt;div&gt;Blah &amp; &quot;blah&quot; &amp; &apos;blah&#39;&lt;/div&gt;')).toBe(
			'<div>Blah & "blah" & \'blah\'</div>',
		);
		expect(unescapeHTML('&amp;lt;')).toBe('&lt;');
		expect(unescapeHTML('&apos;')).toBe("'");
		expect(unescapeHTML('&#39;')).toBe("'");
		expect(unescapeHTML('&#0039;')).toBe("'");
		expect(unescapeHTML('&#x4a;')).toBe('J');
		expect(unescapeHTML('&#x04A;')).toBe('J');
		expect(unescapeHTML('&#X4A;')).toBe('&#X4A;');
		expect(unescapeHTML('&_#39;')).toBe('&_#39;');
		expect(unescapeHTML('&#39_;')).toBe('&#39_;');
		expect(unescapeHTML('&amp;#38;')).toBe('&#38;');
		expect(unescapeHTML('&#38;amp;')).toBe('&amp;');
		expect(unescapeHTML('')).toBe('');
		expect(unescapeHTML('&nbsp;')).toBe(' ');
		expect(unescapeHTML('what is the &yen; to &pound; to &euro; conversion process?')).toBe('what is the ¥ to £ to € conversion process?');
		expect(unescapeHTML('&reg; trademark')).toBe('® trademark');
		expect(unescapeHTML('&trade; unregistered trademark')).toBe('™ unregistered trademark');
		expect(unescapeHTML('&copy; 1992. License available for 50 &cent;')).toBe('© 1992. License available for 50 ¢');

		expect(unescapeHTML(null as unknown as string)).toBe('');
		expect(unescapeHTML(undefined as unknown as string)).toBe('');
		expect(unescapeHTML(5 as unknown as string)).toBe('5');
	});

	it('decodes astral (non-BMP) numeric entities', () => {
		expect(unescapeHTML('&#128512;')).toBe('😀');
		expect(unescapeHTML('&#x1F600;')).toBe('😀');
		expect(unescapeHTML('smile &#128512; here')).toBe('smile 😀 here');
	});

	it('leaves out-of-range numeric entities untouched', () => {
		// 999999999 is within the entity length limit but above U+10FFFF, so
		// String.fromCodePoint would throw; the entity must be returned as-is.
		expect(unescapeHTML('&#999999999;')).toBe('&#999999999;');
		expect(unescapeHTML('&#x110000;')).toBe('&#x110000;');
	});
});
