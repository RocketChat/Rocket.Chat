import assert from 'assert';

import { describe, it } from 'mocha';

import { escapeHTML } from './escapeHTML';

describe('escapeHTML', () => {
	it('works', () => {
		assert.strictEqual(escapeHTML('<div>Blah & "blah" & \'blah\'</div>'), '&lt;div&gt;Blah &amp; &quot;blah&quot; &amp; &#39;blah&#39;&lt;/div&gt;');
		assert.strictEqual(escapeHTML('&lt;'), '&amp;lt;');
		assert.strictEqual(escapeHTML(' '), ' ');
		assert.strictEqual(escapeHTML('¢'), '&cent;');
		assert.strictEqual(escapeHTML('¢ £ ¥ € © ®'), '&cent; &pound; &yen; &euro; &copy; &reg;');
		assert.strictEqual(escapeHTML(5 as unknown as string), '5');
		assert.strictEqual(escapeHTML(''), '');
		assert.strictEqual(escapeHTML(null as unknown as string), '');
		assert.strictEqual(escapeHTML(undefined as unknown as string), '');
	});
});
