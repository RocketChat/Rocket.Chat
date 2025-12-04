import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ISetting } from '../../../../src/definition/settings';
import { SettingType } from '../../../../src/definition/settings';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { SettingsExtend } from '../../../../src/server/accessors';
import type { IAppStorageItem } from '../../../../src/server/storage';

describe('SettingsExtend', () => {
	it('basicSettingsExtend', () => {
		assert.doesNotThrow(() => new SettingsExtend({} as ProxiedApp));
	});

	it('provideSettingToSettingsExtend', async () => {
		const mockedStorageItem: IAppStorageItem = {
			settings: {},
		} as IAppStorageItem;

		const mockedApp: ProxiedApp = {
			getStorageItem: function _getStorageItem() {
				return mockedStorageItem;
			},
		} as ProxiedApp;
		const se = new SettingsExtend(mockedApp);

		const setting: ISetting = {
			id: 'testing',
			type: SettingType.STRING,
			packageValue: 'thing',
			required: false,
			public: false,
			i18nLabel: 'Testing_Settings',
		};

		await assert.doesNotReject(() => se.provideSetting(setting));
		assert.ok(Object.keys(mockedStorageItem.settings).length > 0);

		const settingModified: ISetting = {
			id: 'testing',
			type: SettingType.STRING,
			packageValue: 'thing',
			required: false,
			public: false,
			i18nLabel: 'Testing_Thing',
			value: 'dont-use-me',
		};
		await assert.doesNotReject(() => se.provideSetting(settingModified));
		assert.ok(mockedStorageItem.settings.testing !== undefined);
		assert.ok(mockedStorageItem.settings.testing.value === undefined);
		assert.strictEqual(mockedStorageItem.settings.testing.i18nLabel, 'Testing_Thing');
	});
});
