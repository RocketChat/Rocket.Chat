import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IEnvironmentalVariableRead, IServerSettingRead, ISettingRead } from '../../../../src/definition/accessors';
import { EnvironmentRead } from '../../../../src/server/accessors';

describe('EnvironmentRead', () => {
	it('useEnvironmentRead', () => {
		const evr = {} as IEnvironmentalVariableRead;
		const ssr = {} as IServerSettingRead;
		const sr = {} as ISettingRead;

		assert.doesNotThrow(() => new EnvironmentRead(sr, ssr, evr));

		const er = new EnvironmentRead(sr, ssr, evr);
		assert.ok(er.getSettings() !== undefined);
		assert.ok(er.getServerSettings() !== undefined);
		assert.ok(er.getEnvironmentVariables() !== undefined);
	});
});
