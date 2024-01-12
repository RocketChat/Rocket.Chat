import { isVideoConfJoinProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfJoinProps (definition/rest/v1)', () => {
	describe('isVideoConfJoinProps', () => {
		it('should be a function', () => {
			assert.isFunction(isVideoConfJoinProps);
		});
		it('should return false when provided anything that is not a VideoConfJoinProps', () => {
			assert.isFalse(isVideoConfJoinProps(undefined));
			assert.isFalse(isVideoConfJoinProps(null));
			assert.isFalse(isVideoConfJoinProps(''));
			assert.isFalse(isVideoConfJoinProps(123));
			assert.isFalse(isVideoConfJoinProps({}));
			assert.isFalse(isVideoConfJoinProps([]));
			assert.isFalse(isVideoConfJoinProps(new Date()));
			assert.isFalse(isVideoConfJoinProps(new Error()));
		});
		it('should return false if callId is not provided to VideoConfJoinProps', () => {
			assert.isFalse(isVideoConfJoinProps({}));
		});

		it('should accept a callId with nothing else', () => {
			assert.isTrue(
				isVideoConfJoinProps({
					callId: 'callId',
				}),
			);
		});

		it('should return false when provided with an invalid state', () => {
			assert.isFalse(isVideoConfJoinProps({ callId: 'callId', state: 123 }));
			assert.isFalse(isVideoConfJoinProps({ callId: 'callId', state: [] }));
		});

		it('should return false when extra parameters are provided to VideoConfJoinProps', () => {
			assert.isFalse(
				isVideoConfJoinProps({
					callId: 'callId',
					extra: 'extra',
				}),
			);
		});
	});
});
