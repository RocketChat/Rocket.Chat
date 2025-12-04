import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { NotEnoughMethodArgumentsError } from '../../../../src/server/errors';

describe('NotEnoughMethodArgumentsError', () => {
	it('verifyCompilerError', () => {
		const er = new NotEnoughMethodArgumentsError('enable', 3, 1);

		assert.strictEqual(er.name, 'NotEnoughMethodArgumentsError');
		assert.strictEqual(er.message, 'The method "enable" requires 3 parameters but was only passed 1.');
	});
});
