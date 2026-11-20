import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isDmListEveryoneProps } from './DmListEveryoneProps';

describe('DmListEveryoneProps (definition/rest/v1)', () => {
	describe('isDmListEveryoneProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isDmListEveryoneProps, 'function');
		});

		it('should return false when provided non-object values', () => {
			assert.equal(isDmListEveryoneProps(undefined), false);
			assert.equal(isDmListEveryoneProps(null), false);
			assert.equal(isDmListEveryoneProps(''), false);
			assert.equal(isDmListEveryoneProps(123), false);
			assert.equal(isDmListEveryoneProps([]), false);
		});

		it('should accept empty query parameters', () => {
			assert.equal(isDmListEveryoneProps({}), true);
		});

		it('should accept pagination, fields, and query parameters', () => {
			assert.equal(
				isDmListEveryoneProps({
					count: 20,
					offset: 0,
					sort: JSON.stringify({ name: 1 }),
					fields: JSON.stringify({ usernames: 1 }),
					query: JSON.stringify({ t: 'd' }),
				}),
				true,
			);
		});

		it('should reject unrecognized extra properties', () => {
			assert.equal(isDmListEveryoneProps({ unknownParam: 123 }), false);
		});
	});
});
