import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IAppInfo } from '../../../../src/definition/metadata';
import { RequiredApiVersionError } from '../../../../src/server/errors';

describe('RequiredApiVersionError', () => {
	it('verifyCompilerError', () => {
		const info = {
			requiredApiVersion: '1.0.1',
			name: 'Testing',
			id: 'fake-id',
		} as IAppInfo;
		const er = new RequiredApiVersionError(info, '1.0.0');

		assert.strictEqual(er.name, 'RequiredApiVersion');
		assert.strictEqual(
			er.message,
			'Failed to load the App "Testing" (fake-id) as it requires v1.0.1 of the App API however your server comes with v1.0.0.',
		);

		const er2 = new RequiredApiVersionError(info, '2.0.0');

		assert.strictEqual(er2.name, 'RequiredApiVersion');
		assert.strictEqual(
			er2.message,
			'Failed to load the App "Testing" (fake-id) as it requires v1.0.1 of the App API however your server comes with v2.0.0. Please tell the author to update their App as it is out of date.',
		);
	});
});
