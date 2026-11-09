import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { MustContainFunctionError } from '../../../src/server/errors/index.js';

describe('MustContainFunctionError', () => {
	it('verifyCompilerError', () => {
		const er = new MustContainFunctionError('App.ts', 'getVersion');

		assert.strictEqual(er.name, 'MustContainFunction');
		assert.strictEqual(er.message, 'The App (App.ts) doesn\'t have a "getVersion" function which is required.');
	});
});
