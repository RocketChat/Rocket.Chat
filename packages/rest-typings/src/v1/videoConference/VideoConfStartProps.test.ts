import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfStartProps } from './VideoConfStartProps';

describe('VideoConfStartProps (definition/rest/v1)', () => {
	describe('isVideoConfStartProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isVideoConfStartProps, 'function');
		});
		it('should return false when provided anything that is not an VideoConfStartProps', () => {
			assert.equal(isVideoConfStartProps(undefined), false);
			assert.equal(isVideoConfStartProps(null), false);
			assert.equal(isVideoConfStartProps(''), false);
			assert.equal(isVideoConfStartProps(123), false);
			assert.equal(isVideoConfStartProps({}), false);
			assert.equal(isVideoConfStartProps([]), false);
			assert.equal(isVideoConfStartProps(new Date()), false);
			assert.equal(isVideoConfStartProps(new Error()), false);
		});
		it('should return false if roomId is not provided to VideoConfStartProps', () => {
			assert.equal(isVideoConfStartProps({}), false);
		});

		it('should accept a roomId with nothing else', () => {
			assert.equal(
				isVideoConfStartProps({
					roomId: 'roomId',
				}),
				true,
			);
		});

		it('should accept the allowRinging parameter', () => {
			assert.equal(
				isVideoConfStartProps({
					roomId: 'roomId',
					allowRinging: true,
				}),
				true,
			);
		});

		it('should accept a roomId with a title', () => {
			assert.equal(
				isVideoConfStartProps({
					roomId: 'roomId',
					title: 'extra',
				}),
				true,
			);
		});

		it('should return false when extra parameters are provided to VideoConfStartProps', () => {
			assert.equal(
				isVideoConfStartProps({
					roomId: 'roomId',
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
