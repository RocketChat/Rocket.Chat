import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { SettingRead } from '../../../../src/server/accessors';
import type { IAppStorageItem } from '../../../../src/server/storage';
import { TestData } from '../../../test-data/utilities';

describe('SettingRead', () => {
	it('appSettingRead', async () => {
		const mockStorageItem = {
			settings: {},
		} as IAppStorageItem;
		mockStorageItem.settings.testing = TestData.getSetting('testing');

		const si = mockStorageItem;
		const mockProxiedApp = {
			getStorageItem(): IAppStorageItem {
				return si;
			},
		} as ProxiedApp;

		assert.doesNotThrow(() => new SettingRead({} as ProxiedApp));

		const sr = new SettingRead(mockProxiedApp);
		assert.ok((await sr.getById('testing')) !== undefined);
		assert.deepStrictEqual(await sr.getById('testing'), TestData.getSetting('testing'));
		assert.strictEqual(await sr.getValueById('testing'), 'The packageValue');
		mockStorageItem.settings.testing.value = 'my value';
		assert.strictEqual(await sr.getValueById('testing'), 'my value');
		await assert.rejects(() => sr.getValueById('superfake'), {
			name: 'Error',
			message: 'Setting "superfake" does not exist.',
		});
	});
});
