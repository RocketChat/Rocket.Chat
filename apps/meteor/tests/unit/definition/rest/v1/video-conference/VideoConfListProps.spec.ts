import { isVideoConfListProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfListProps (definition/rest/v1)', () => {
	describe('isVideoConfListProps', () => {
		it('should be a function', () => {
			assert.isFunction(isVideoConfListProps);
		});
		it('should return false when provided anything that is not an VideoConfListProps', () => {
			assert.isFalse(isVideoConfListProps(undefined));
			assert.isFalse(isVideoConfListProps(null));
			assert.isFalse(isVideoConfListProps(''));
			assert.isFalse(isVideoConfListProps(123));
			assert.isFalse(isVideoConfListProps({}));
			assert.isFalse(isVideoConfListProps([]));
			assert.isFalse(isVideoConfListProps(new Date()));
			assert.isFalse(isVideoConfListProps(new Error()));
		});
		it('should return false if roomId is not provided to VideoConfListProps', () => {
			assert.isFalse(isVideoConfListProps({}));
		});

		it('should accept a roomId with nothing else', () => {
			assert.isTrue(
				isVideoConfListProps({
					roomId: 'roomId',
				}),
			);
		});

		it('should accept the count and offset parameters', () => {
			assert.isTrue(
				isVideoConfListProps({
					roomId: 'roomId',
					offset: 50,
					count: 25,
				}),
			);
		});

		it('should return false when extra parameters are provided to VideoConfListProps', () => {
			assert.isFalse(
				isVideoConfListProps({
					roomId: 'roomId',
					extra: 'extra',
				}),
			);
		});
	});
});
