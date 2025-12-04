import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { CompilerError } from '../../../../src/server/errors';

describe('CompilerError', () => {
	it('verifyCompilerError', () => {
		const er = new CompilerError('syntax');

		assert.strictEqual(er.name, 'CompilerError');
		assert.strictEqual(er.message, 'An error occured while compiling an App: syntax');
	});
});
