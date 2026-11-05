import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfJoinProps } from './VideoConfJoinProps';

describe('VideoConfJoinProps (definition/rest/v1)', () => {
	describe('isVideoConfJoinProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isVideoConfJoinProps, 'function');
		});
		it('should return false when provided anything that is not an VideoConfJoinProps', () => {
			assert.equal(isVideoConfJoinProps(undefined), false);
			assert.equal(isVideoConfJoinProps(null), false);
			assert.equal(isVideoConfJoinProps(''), false);
			assert.equal(isVideoConfJoinProps(123), false);
			assert.equal(isVideoConfJoinProps({}), false);
			assert.equal(isVideoConfJoinProps([]), false);
			assert.equal(isVideoConfJoinProps(new Date()), false);
			assert.equal(isVideoConfJoinProps(new Error()), false);
		});
		it('should return false if callId is not provided to VideoConfJoinProps', () => {
			assert.equal(isVideoConfJoinProps({}), false);
		});

		it('should accept a callId with nothing else', () => {
			assert.equal(
				isVideoConfJoinProps({
					callId: 'callId',
				}),
				true,
			);
		});

		it('should return false when provided with an invalid state', () => {
			assert.equal(isVideoConfJoinProps({ callId: 'callId', state: 123 }), false);
			assert.equal(isVideoConfJoinProps({ callId: 'callId', state: [] }), false);
		});

		it('should return false when extra parameters are provided to VideoConfJoinProps', () => {
			assert.equal(
				isVideoConfJoinProps({
					callId: 'callId',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
