import { isVideoConfStartProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfStartProps (definition/rest/v1)', () => {
	describe('isVideoConfStartProps', () => {
		it('should be a function', () => {
			assert.isFunction(isVideoConfStartProps);
		});
		it('should return false when provided anything that is not a VideoConfStartProps', () => {
			assert.isFalse(isVideoConfStartProps(undefined));
			assert.isFalse(isVideoConfStartProps(null));
			assert.isFalse(isVideoConfStartProps(''));
			assert.isFalse(isVideoConfStartProps(123));
			assert.isFalse(isVideoConfStartProps({}));
			assert.isFalse(isVideoConfStartProps([]));
			assert.isFalse(isVideoConfStartProps(new Date()));
			assert.isFalse(isVideoConfStartProps(new Error()));
		});
		it('should return false if roomId is not provided to VideoConfStartProps', () => {
			assert.isFalse(isVideoConfStartProps({}));
		});

		it('should accept a roomId with nothing else', () => {
			assert.isTrue(
				isVideoConfStartProps({
					roomId: 'roomId',
				}),
			);
		});

		it('should accept the allowRinging parameter', () => {
			assert.isTrue(
				isVideoConfStartProps({
					roomId: 'roomId',
					allowRinging: true,
				}),
			);
		});

		it('should accept a roomId with a title', () => {
			assert.isTrue(
				isVideoConfStartProps({
					roomId: 'roomId',
					title: 'extra',
				}),
			);
		});

		it('should return false when extra parameters are provided to VideoConfStartProps', () => {
			assert.isFalse(
				isVideoConfStartProps({
					roomId: 'roomId',
					extra: 'extra',
				}),
			);
		});
	});
});
