import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isDmListProps, isDmListEveryoneProps } from './DmListProps';

describe('DmListProps', () => {
	it('should be a function', () => {
		assert.equal(typeof isDmListProps, 'function');
		assert.equal(typeof isDmListEveryoneProps, 'function');
	});

	it('should return false when provided anything that is not an object', () => {
		assert.equal(isDmListProps(undefined), false);
		assert.equal(isDmListProps(null), false);
		assert.equal(isDmListProps(''), false);
		assert.equal(isDmListProps(123), false);
		assert.equal(isDmListProps([]), false);
	});

	it('should accept an empty object', () => {
		assert.equal(isDmListProps({}), true);
		assert.equal(isDmListEveryoneProps({}), true);
	});

	it('should accept count and offset parameters', () => {
		assert.equal(
			isDmListProps({
				offset: 50,
				count: 25,
			}),
			true,
		);
		assert.equal(
			isDmListEveryoneProps({
				offset: 50,
				count: 25,
			}),
			true,
		);
	});

	it('should accept sort parameter', () => {
		assert.equal(
			isDmListProps({
				sort: '{"name": 1}',
			}),
			true,
		);
	});

	it('should return false when extra parameters are provided', () => {
		assert.equal(
			isDmListProps({
				extra: 'extra',
			}),
			false,
		);
	});
});
