import type http from 'node:http';

import type { IUpload } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getFileRange } from './ranges';

const req = (range?: string) => ({ headers: { range } }) as http.IncomingMessage;
const file = (size: number) => ({ size }) as IUpload;

describe('getFileRange', () => {
	it('returns undefined when no Range header is present', () => {
		expect(getFileRange(file(1000), req())).to.equal(undefined);
	});

	it('returns undefined for a malformed Range header', () => {
		expect(getFileRange(file(1000), req('bytes=abc'))).to.equal(undefined);
		expect(getFileRange(file(1000), req('items=0-99'))).to.equal(undefined);
		expect(getFileRange(file(1000), req('bytes=-'))).to.equal(undefined);
	});

	it('returns undefined when the file has no size', () => {
		expect(getFileRange(file(0), req('bytes=0-'))).to.equal(undefined);
	});

	it('serves an open-ended range `bytes=0-` as the whole file', () => {
		expect(getFileRange(file(1000), req('bytes=0-'))).to.deep.equal({ outOfRange: false, start: 0, stop: 999 });
	});

	it('serves an open-ended range from a mid-file offset to EOF', () => {
		expect(getFileRange(file(1000), req('bytes=77-'))).to.deep.equal({ outOfRange: false, start: 77, stop: 999 });
	});

	it('serves an explicit closed range', () => {
		expect(getFileRange(file(1000), req('bytes=100-199'))).to.deep.equal({ outOfRange: false, start: 100, stop: 199 });
	});

	it('clamps an end that runs past EOF', () => {
		expect(getFileRange(file(1000), req('bytes=100-5000'))).to.deep.equal({ outOfRange: false, start: 100, stop: 999 });
	});

	it('serves a suffix range `bytes=-N` as the last N bytes', () => {
		expect(getFileRange(file(1000), req('bytes=-200'))).to.deep.equal({ outOfRange: false, start: 800, stop: 999 });
	});

	it('clamps a suffix range larger than the file to the whole file', () => {
		expect(getFileRange(file(1000), req('bytes=-5000'))).to.deep.equal({ outOfRange: false, start: 0, stop: 999 });
	});

	it('flags a start at or beyond EOF as out of range', () => {
		expect(getFileRange(file(1000), req('bytes=1000-'))).to.deep.equal({ outOfRange: true, start: 1000, stop: 999 });
		expect(getFileRange(file(1000), req('bytes=1500-1600'))).to.deep.equal({ outOfRange: true, start: 1500, stop: 999 });
	});

	it('flags an inverted closed range as out of range', () => {
		expect(getFileRange(file(1000), req('bytes=200-100'))).to.deep.equal({ outOfRange: true, start: 200, stop: 100 });
	});

	it('serves the final byte of the file', () => {
		expect(getFileRange(file(1000), req('bytes=999-'))).to.deep.equal({ outOfRange: false, start: 999, stop: 999 });
	});
});
