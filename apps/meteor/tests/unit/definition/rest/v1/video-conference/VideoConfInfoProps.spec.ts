import { isVideoConfInfoProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfInfoProps (definition/rest/v1)', () => {
	describe('isVideoConfInfoProps', () => {
		it('should be a function', () => {
			assert.isFunction(isVideoConfInfoProps);
		});
		it('should return false when provided anything that is not an VideoConfInfoProps', () => {
			assert.isFalse(isVideoConfInfoProps(undefined));
			assert.isFalse(isVideoConfInfoProps(null));
			assert.isFalse(isVideoConfInfoProps(''));
			assert.isFalse(isVideoConfInfoProps(123));
			assert.isFalse(isVideoConfInfoProps({}));
			assert.isFalse(isVideoConfInfoProps([]));
			assert.isFalse(isVideoConfInfoProps(new Date()));
			assert.isFalse(isVideoConfInfoProps(new Error()));
		});
		it('should return false if callId is not provided to VideoConfInfoProps', () => {
			assert.isFalse(isVideoConfInfoProps({}));
		});

		it('should accept a callId with nothing else', () => {
			assert.isTrue(
				isVideoConfInfoProps({
					callId: 'callId',
				}),
			);
		});

		it('should return false when extra parameters are provided to VideoConfInfoProps', () => {
			assert.isFalse(
				isVideoConfInfoProps({
					callId: 'callId',
					extra: 'extra',
				}),
			);
		});
	});
});
