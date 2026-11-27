import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isDmListProps } from './DmListProps';

describe('DmListProps (definition/rest/v1)', () => {
	describe('isDmListProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isDmListProps, 'function');
		});

		it('should return false when provided non-object values', () => {
			assert.equal(isDmListProps(undefined), false);
			assert.equal(isDmListProps(null), false);
			assert.equal(isDmListProps(''), false);
			assert.equal(isDmListProps(123), false);
			assert.equal(isDmListProps([]), false);
		});

		it('should accept empty query parameters', () => {
			assert.equal(isDmListProps({}), true);
		});

		it('should accept pagination and fields parameters', () => {
			assert.equal(
				isDmListProps({
					count: 20,
					offset: 0,
					sort: JSON.stringify({ name: 1 }),
					fields: JSON.stringify({ usernames: 1 }),
				}),
				true,
			);
		});

		it('should reject unrecognized extra properties', () => {
			assert.equal(isDmListProps({ invalidProp: 'bad' }), false);
		});
	});
});
