import { isVideoConfCancelProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfCancelProps (definition/rest/v1)', () => {
	describe('isVideoConfCancelProps', () => {
		it('should be a function', () => {
			assert.isFunction(isVideoConfCancelProps);
		});
		it('should return false when provided anything that is not a
		 VideoConfCancelProps', () => {
			assert.isFalse(isVideoConfCancelProps(undefined));
			assert.isFalse(isVideoConfCancelProps(null));
			assert.isFalse(isVideoConfCancelProps(''));
			assert.isFalse(isVideoConfCancelProps(123));
			assert.isFalse(isVideoConfCancelProps({}));
			assert.isFalse(isVideoConfCancelProps([]));
			assert.isFalse(isVideoConfCancelProps(new Date()));
			assert.isFalse(isVideoConfCancelProps(new Error()));
		});
		it('should return false if callId is not provided to VideoConfCancelProps', () => {
			assert.isFalse(isVideoConfCancelProps({}));
		});

		it('should accept a callId with nothing else', () => {
			assert.isTrue(
				isVideoConfCancelProps({
					callId: 'callId',
				}),
			);
		});

		it('should return false when extra parameters are provided to VideoConfCancelProps', () => {
			assert.isFalse(
				isVideoConfCancelProps({
					callId: 'callId',
					extra: 'extra',
				}),
			);
		});
	});
});
