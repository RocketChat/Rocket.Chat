import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { MustExtendAppError } from '../../../../src/server/errors';

describe('MustExtendAppError', () => {
	it('verifyCompilerError', () => {
		const er = new MustExtendAppError();

		assert.strictEqual(er.name, 'MustExtendApp');
		assert.strictEqual(er.message, 'App must extend the "App" abstract class.');
	});
});
