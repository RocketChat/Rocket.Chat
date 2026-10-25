import { describe, it } from 'node:test';

import { expect } from 'chai';

import { replaceUsernameMentions } from './replaceUsernameMentions';

describe('replaceUsernameMentions', () => {
	it('should replace mentions of the previous username', () => {
		expect(replaceUsernameMentions('hi @jo, welcome', 'jo', 'joe')).to.equal('hi @joe, welcome');
	});

	it('should replace mentions regardless of case', () => {
		expect(replaceUsernameMentions('hi @JO', 'jo', 'joe')).to.equal('hi @joe');
	});

	it('should replace a mention that ends a sentence', () => {
		expect(replaceUsernameMentions('thanks @jo.', 'jo', 'joe')).to.equal('thanks @joe.');
	});

	it('should leave mentions of longer usernames that start with the previous one', () => {
		expect(replaceUsernameMentions('@john and @jo', 'jo', 'joe')).to.equal('@john and @joe');
		expect(replaceUsernameMentions('@jo.smith and @jo', 'jo', 'joe')).to.equal('@jo.smith and @joe');
	});

	it('should match dots in the previous username literally', () => {
		expect(replaceUsernameMentions('@john.doe and @johnxdoe', 'john.doe', 'jd')).to.equal('@jd and @johnxdoe');
	});

	it('should leave email addresses alone', () => {
		expect(replaceUsernameMentions('@jo write to x@jo', 'jo', 'joe')).to.equal('@joe write to x@jo');
	});

	it('should replace every mention of the previous username', () => {
		expect(replaceUsernameMentions('@jo, @JO and @jo', 'jo', 'joe')).to.equal('@joe, @joe and @joe');
	});

	it('should leave mentions of longer usernames with non-ASCII letters', () => {
		expect(replaceUsernameMentions('@joé and @jo', 'jo', 'joe')).to.equal('@joé and @joe');
	});

	it('should replace mentions of a username with a hyphen', () => {
		expect(replaceUsernameMentions('hi @john-doe', 'john-doe', 'jd')).to.equal('hi @jd');
	});

	it('should insert the new username literally', () => {
		expect(replaceUsernameMentions('hi @jo', 'jo', 'a$&b')).to.equal('hi @a$&b');
	});
});
