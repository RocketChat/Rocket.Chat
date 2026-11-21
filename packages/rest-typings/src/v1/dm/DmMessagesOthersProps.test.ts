import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isDmMessagesOthersProps } from './DmMessagesOthersProps';

describe('DmMessagesOthersProps (definition/rest/v1)', () => {
	describe('isDmMessagesOthersProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isDmMessagesOthersProps, 'function');
		});

		it('should return false when provided non-object values', () => {
			assert.equal(isDmMessagesOthersProps(undefined), false);
			assert.equal(isDmMessagesOthersProps(null), false);
			assert.equal(isDmMessagesOthersProps(''), false);
			assert.equal(isDmMessagesOthersProps(123), false);
			assert.equal(isDmMessagesOthersProps([]), false);
		});

		it('should return false if roomId is missing', () => {
			assert.equal(isDmMessagesOthersProps({}), false);
			assert.equal(isDmMessagesOthersProps({ count: 10 }), false);
		});

		it('should return false if roomId is empty string', () => {
			assert.equal(isDmMessagesOthersProps({ roomId: '' }), false);
		});

		it('should accept valid roomId with optional pagination, sort, fields, and query', () => {
			assert.equal(isDmMessagesOthersProps({ roomId: 'room-123' }), true);
			assert.equal(
				isDmMessagesOthersProps({
					roomId: 'room-123',
					count: 20,
					offset: 0,
					sort: JSON.stringify({ ts: -1 }),
					fields: JSON.stringify({ msg: 1 }),
					query: JSON.stringify({}),
				}),
				true,
			);
		});

		it('should reject unrecognized extra properties', () => {
			assert.equal(isDmMessagesOthersProps({ roomId: 'room-123', invalidProp: true }), false);
		});
	});
});
