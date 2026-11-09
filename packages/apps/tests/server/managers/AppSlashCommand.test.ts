import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands/index.js';

import type { AppManager } from '../../../src/server/AppManager.js';
import { AppSlashCommand } from '../../../src/server/managers/AppSlashCommand.js';
import type { IAppStorageItem } from '../../../src/server/storage/index.js';
import { TestData } from '../../test-data/utilities.js';

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
