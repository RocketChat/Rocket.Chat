import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppCompiler } from '../../../../src/server/compiler';

describe('AppCompiler', () => {
	it('verifyStorageFileToCompiler', () => {
		const compiler = new AppCompiler();

		assert.doesNotThrow(() => compiler.normalizeStorageFiles({}));

		const files: { [key: string]: string } = {
			TestingApp$ts: 'act-like-this-is-real',
			TestingAppCommand$ts: 'something-here-as well, yay',
		};

		const expected: { [key: string]: string } = {
			'TestingApp.ts': files.TestingApp$ts,
			'TestingAppCommand.ts': files.TestingAppCommand$ts,
		};

		assert.deepStrictEqual(compiler.normalizeStorageFiles(files), expected);
	});
});
