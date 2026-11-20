import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isDmMessagesOthersProps } from './DmMessagesOthersProps';

describe('DmMessagesOthersProps', () => {
	it('should be a function', () => {
		assert.equal(typeof isDmMessagesOthersProps, 'function');
	});

	it('should return false when provided anything that is not an object', () => {
		assert.equal(isDmMessagesOthersProps(undefined), false);
		assert.equal(isDmMessagesOthersProps(null), false);
		assert.equal(isDmMessagesOthersProps(''), false);
		assert.equal(isDmMessagesOthersProps(123), false);
		assert.equal(isDmMessagesOthersProps([]), false);
	});

	it('should return false if roomId is not provided', () => {
		assert.equal(isDmMessagesOthersProps({}), false);
	});

	it('should accept a roomId with nothing else', () => {
		assert.equal(
			isDmMessagesOthersProps({
				roomId: 'roomId',
			}),
			true,
		);
	});

	it('should accept roomId with count and offset parameters', () => {
		assert.equal(
			isDmMessagesOthersProps({
				roomId: 'roomId',
				offset: 50,
				count: 25,
			}),
			true,
		);
	});

	it('should accept roomId with sort parameter', () => {
		assert.equal(
			isDmMessagesOthersProps({
				roomId: 'roomId',
				sort: '{"ts": -1}',
			}),
			true,
		);
	});

	it('should return false when extra parameters are provided', () => {
		assert.equal(
			isDmMessagesOthersProps({
				roomId: 'roomId',
				extra: 'extra',
			}),
			false,
		);
	});
});
