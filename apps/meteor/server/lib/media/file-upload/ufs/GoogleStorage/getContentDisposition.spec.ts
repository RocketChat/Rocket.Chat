import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getContentDisposition } from './getContentDisposition';

describe('getContentDisposition', () => {
	it('quotes filenames containing commas and spaces', () => {
		expect(getContentDisposition('inline', 'thumb-Clipboard - August 21, 2026 11:47 AM.png')).to.equal(
			'inline; filename="thumb-Clipboard - August 21, 2026 11:47 AM.png"',
		);
	});

	it('escapes quotes and backslashes in the quoted filename', () => {
		expect(getContentDisposition('attachment', 'report "final"\\copy.pdf')).to.equal(
			'attachment; filename="report \\"final\\"\\\\copy.pdf"',
		);
	});

	it('adds an RFC 5987 filename for Unicode characters', () => {
		expect(getContentDisposition('inline', "résumé's (final)*.pdf")).to.equal(
			"inline; filename=\"r_sum_'s (final)*.pdf\"; filename*=UTF-8''r%C3%A9sum%C3%A9%27s%20%28final%29%2A.pdf",
		);
	});

	it('replaces control characters before constructing the header value', () => {
		expect(getContentDisposition('inline', 'report\r\nX-Test: value.txt')).to.equal('inline; filename="report__X-Test: value.txt"');
	});

	it('preserves simple ASCII filenames', () => {
		expect(getContentDisposition('inline', 'photo.png')).to.equal('inline; filename="photo.png"');
	});
});
