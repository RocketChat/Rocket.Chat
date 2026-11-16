import { describe, it } from 'node:test';

import { expect } from 'chai';

import { parsePinned } from './parsePinned';

describe('parsePinned', () => {
	it('should return { pinned: true } when pinned is true or "true"', () => {
		expect(parsePinned(true)).to.deep.equal({ pinned: true });
		expect(parsePinned('true')).to.deep.equal({ pinned: true });
		expect(parsePinned('True')).to.deep.equal({ pinned: true });
	});

	it('should return { pinned: { $ne: true } } when pinned is false or "false"', () => {
		expect(parsePinned(false)).to.deep.equal({ pinned: { $ne: true } });
		expect(parsePinned('false')).to.deep.equal({ pinned: { $ne: true } });
		expect(parsePinned('False')).to.deep.equal({ pinned: { $ne: true } });
	});

	it('should return {} when pinned is undefined or not a boolean string', () => {
		expect(parsePinned(undefined)).to.deep.equal({});
		expect(parsePinned('')).to.deep.equal({});
		expect(parsePinned('invalid')).to.deep.equal({});
	});
});
