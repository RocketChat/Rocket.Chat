import { expect } from 'chai';
import { describe, it } from 'mocha';

import { parseUriList } from '../../../../../../server/lib/auth/oauth2-server/parseUriList';

describe('parseUriList', () => {
	it('should return an empty list for an empty string', () => {
		expect(parseUriList('')).to.deep.equal([]);
	});

	it('should return an empty list for a blank string', () => {
		expect(parseUriList('   \n  ')).to.deep.equal([]);
	});

	it('should return a single-entry list for a single uri', () => {
		expect(parseUriList('https://example.com')).to.deep.equal(['https://example.com']);
	});

	it('should trim surrounding whitespace from a single uri', () => {
		expect(parseUriList('  https://example.com  ')).to.deep.equal(['https://example.com']);
	});

	it('should trim a trailing separator from a single uri', () => {
		expect(parseUriList('https://example.com\n')).to.deep.equal(['https://example.com']);
	});

	it('should split and trim a comma separated list', () => {
		expect(parseUriList('https://a.com , https://b.com')).to.deep.equal(['https://a.com', 'https://b.com']);
	});

	it('should split and trim a newline separated list', () => {
		expect(parseUriList('https://a.com\n  https://b.com  \n')).to.deep.equal(['https://a.com', 'https://b.com']);
	});

	it('should ignore blank entries when separators are mixed', () => {
		expect(parseUriList('https://a.com,,\n , https://b.com\n')).to.deep.equal(['https://a.com', 'https://b.com']);
	});
});
