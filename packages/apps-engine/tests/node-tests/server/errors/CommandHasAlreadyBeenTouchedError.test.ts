import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { CommandHasAlreadyBeenTouchedError } from '../../../../src/server/errors';

describe('CommandHasAlreadyBeenTouchedError', () => {
	it('verifyCommandHasAlreadyBeenTouched', () => {
		const er = new CommandHasAlreadyBeenTouchedError('testing');

		assert.strictEqual(er.name, 'CommandHasAlreadyBeenTouched');
		assert.strictEqual(er.message, 'The command "testing" has already been touched by another App.');
	});
});
