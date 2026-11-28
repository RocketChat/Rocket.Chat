import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfInfoProps } from './VideoConfInfoProps';

describe('VideoConfInfoProps (definition/rest/v1)', () => {
	describe('isVideoConfInfoProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isVideoConfInfoProps, 'function');
		});
		it('should return false when provided anything that is not an VideoConfInfoProps', () => {
			assert.equal(isVideoConfInfoProps(undefined), false);
			assert.equal(isVideoConfInfoProps(null), false);
			assert.equal(isVideoConfInfoProps(''), false);
			assert.equal(isVideoConfInfoProps(123), false);
			assert.equal(isVideoConfInfoProps({}), false);
			assert.equal(isVideoConfInfoProps([]), false);
			assert.equal(isVideoConfInfoProps(new Date()), false);
			assert.equal(isVideoConfInfoProps(new Error()), false);
		});
		it('should return false if callId is not provided to VideoConfInfoProps', () => {
			assert.equal(isVideoConfInfoProps({}), false);
		});

		it('should accept a callId with nothing else', () => {
			assert.equal(
				isVideoConfInfoProps({
					callId: 'callId',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to VideoConfInfoProps', () => {
			assert.equal(
				isVideoConfInfoProps({
					callId: 'callId',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
