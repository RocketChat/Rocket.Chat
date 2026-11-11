import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfListProps } from './VideoConfListProps';

describe('VideoConfListProps (definition/rest/v1)', () => {
	describe('isVideoConfListProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isVideoConfListProps, 'function');
		});
		it('should return false when provided anything that is not an VideoConfListProps', () => {
			assert.equal(isVideoConfListProps(undefined), false);
			assert.equal(isVideoConfListProps(null), false);
			assert.equal(isVideoConfListProps(''), false);
			assert.equal(isVideoConfListProps(123), false);
			assert.equal(isVideoConfListProps({}), false);
			assert.equal(isVideoConfListProps([]), false);
			assert.equal(isVideoConfListProps(new Date()), false);
			assert.equal(isVideoConfListProps(new Error()), false);
		});
		it('should return false if roomId is not provided to VideoConfListProps', () => {
			assert.equal(isVideoConfListProps({}), false);
		});

		it('should accept a roomId with nothing else', () => {
			assert.equal(
				isVideoConfListProps({
					roomId: 'roomId',
				}),
				true,
			);
		});

		it('should accept the count and offset parameters', () => {
			assert.equal(
				isVideoConfListProps({
					roomId: 'roomId',
					offset: 50,
					count: 25,
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to VideoConfListProps', () => {
			assert.equal(
				isVideoConfListProps({
					roomId: 'roomId',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
