import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { toAbacActor } from './toAbacActor';

describe('toAbacActor', () => {
	it('returns only the actor fields', () => {
		const user = { _id: 'u1', username: 'alice', name: 'Alice', services: { secret: 'private' } };

		assert.deepEqual(toAbacActor(user), { _id: 'u1', username: 'alice', name: 'Alice' });
	});

	it('rejects a missing or empty username', () => {
		for (const username of [undefined, '']) {
			assert.throws(() => toAbacActor({ _id: 'u1', username }), { message: 'error-invalid-user' });
		}
	});
});
