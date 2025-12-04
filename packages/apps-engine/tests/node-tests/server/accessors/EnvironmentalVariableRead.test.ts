import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { EnvironmentalVariableRead } from '../../../../src/server/accessors';
import type { EnvironmentalVariableBridge } from '../../../../src/server/bridges';

describe('EnvironmentalVariableRead', () => {
	it('useEnvironmentalVariableRead', async () => {
		const mockEnvVarBridge = {
			doGetValueByName(name: string, appId: string): Promise<string> {
				return Promise.resolve('value');
			},
			doIsReadable(name: string, appId: string): Promise<boolean> {
				return Promise.resolve(true);
			},
			doIsSet(name: string, appId: string): Promise<boolean> {
				return Promise.resolve(false);
			},
		} as EnvironmentalVariableBridge;

		assert.doesNotThrow(() => new EnvironmentalVariableRead(mockEnvVarBridge, 'testing'));

		const evr = new EnvironmentalVariableRead(mockEnvVarBridge, 'testing');
		assert.strictEqual(await evr.getValueByName('testing'), 'value');
		assert.ok(await evr.isReadable('testing'));
		assert.ok(!(await evr.isSet('testing2')));
	});
});
