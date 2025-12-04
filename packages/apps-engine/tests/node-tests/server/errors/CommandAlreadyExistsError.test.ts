import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { CommandAlreadyExistsError } from '../../../../src/server/errors';

describe('CommandAlreadyExistsError', () => {
	it('verifyCommandAlreadyExistsError', () => {
		const er = new CommandAlreadyExistsError('testing');

		assert.strictEqual(er.name, 'CommandAlreadyExists');
		assert.strictEqual(er.message, 'The command "testing" already exists in the system.');
	});
});
