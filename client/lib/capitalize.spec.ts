import assert from 'assert';

import { describe, it } from 'mocha';

import { capitalize } from './capitalize';

describe('capitalize', () => {
	it('should convert "xyz" to "Xyz"', () => {
		assert.equal(capitalize('xyz'), 'Xyz');
	});

	it('should convert "xyz xyz" to "Xyz xyz"', () => {
		assert.equal(capitalize('xyz xyz'), 'Xyz xyz');
	});

	it('should convert " xyz" to " xyz"', () => {
		assert.equal(capitalize(' xyz'), ' xyz');
	});

	it('should convert undefined to ""', () => {
		assert.equal(capitalize(undefined as unknown as string), '');
	});

	it('should convert null to ""', () => {
		assert.equal(capitalize(null as unknown as string), '');
	});

	it('should convert false to ""', () => {
		assert.equal(capitalize(false as unknown as string), '');
	});

	it('should convert true to ""', () => {
		assert.equal(capitalize(true as unknown as string), '');
	});

	it('should convert 0 to ""', () => {
		assert.equal(capitalize(0 as unknown as string), '');
	});

	it('should convert 1 to ""', () => {
		assert.equal(capitalize(1 as unknown as string), '');
	});
});
