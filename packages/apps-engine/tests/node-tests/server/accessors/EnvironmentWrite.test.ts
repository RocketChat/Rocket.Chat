import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IServerSettingUpdater, ISettingUpdater } from '../../../../src/definition/accessors';
import { EnvironmentWrite } from '../../../../src/server/accessors';

describe('EnvironmentWrite', () => {
	it('useEnvironmentWrite', () => {
		const sr = {} as ISettingUpdater;
		const serverSettings = {} as IServerSettingUpdater;

		assert.doesNotThrow(() => new EnvironmentWrite(sr, serverSettings));

		const er = new EnvironmentWrite(sr, serverSettings);
		assert.ok(er.getSettings() !== undefined);
		assert.ok(er.getServerSettings() !== undefined);
	});
});
