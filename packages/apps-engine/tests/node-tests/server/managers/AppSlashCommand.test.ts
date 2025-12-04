import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IAppStorageItem } from '../../../../server/storage';
import type { ISlashCommand } from '../../../../src/definition/slashcommands';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppSlashCommand } from '../../../../src/server/managers/AppSlashCommand';
import { TestData } from '../../../test-data/utilities';

describe('AppSlashCommand', () => {
	it('ensureAppSlashCommand', () => {
		const mockApp = TestData.getMockApp({ info: { id: 'test', name: 'TestApp' } } as IAppStorageItem, {} as AppManager);

		assert.doesNotThrow(() => new AppSlashCommand(mockApp, {} as ISlashCommand));

		const ascr = new AppSlashCommand(mockApp, {} as ISlashCommand);
		assert.strictEqual(ascr.isRegistered, false);
		assert.strictEqual(ascr.isEnabled, false);
		assert.strictEqual(ascr.isDisabled, false);

		ascr.hasBeenRegistered();
		assert.strictEqual(ascr.isDisabled, false);
		assert.strictEqual(ascr.isEnabled, true);
		assert.strictEqual(ascr.isRegistered, true);
	});
});
