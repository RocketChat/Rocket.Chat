import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { SettingUpdater } from '../../../../src/server/accessors';
import type { AppSettingsManager } from '../../../../src/server/managers';
import type { IAppStorageItem } from '../../../../src/server/storage';
import { TestData } from '../../../test-data/utilities';

describe('SettingUpdater', () => {
	let mockStorageItem: IAppStorageItem;
	let mockProxiedApp: ProxiedApp;
	let mockSettingsManager: AppSettingsManager;

	beforeEach(() => {
		// Set up mock storage with test settings
		mockStorageItem = {
			settings: {},
		} as IAppStorageItem;

		mockStorageItem.settings.singleValue = TestData.getSetting('singleValue');
		mockStorageItem.settings.multiValue = {
			...TestData.getSetting('multiValue'),
			values: [
				{ key: 'key1', i18nLabel: 'value1' },
				{ key: 'key2', i18nLabel: 'value2' },
			],
		};

		// Mock ProxiedApp
		const si = mockStorageItem;
		mockProxiedApp = {
			getStorageItem(): IAppStorageItem {
				return si;
			},
			getID(): string {
				return 'test-app-id';
			},
		} as ProxiedApp;

		// Mock AppSettingsManager
		mockSettingsManager = {} as AppSettingsManager;
		mockSettingsManager.getAppSetting = (appId: string, settingId: string) => {
			return mockStorageItem.settings[settingId];
		};
		mockSettingsManager.updateAppSetting = (appId: string, setting: any) => {
			mockStorageItem.settings[setting.id] = setting;
			return Promise.resolve();
		};
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('updateValueSuccessfully', async () => {
		const updateAppSettingSpy = mock.method(mockSettingsManager, 'updateAppSetting');
		const settingUpdater = new SettingUpdater(mockProxiedApp, mockSettingsManager);

		await settingUpdater.updateValue('singleValue', 'updated value');

		assert.ok(updateAppSettingSpy.mock.calls.length > 0);
		assert.strictEqual(mockStorageItem.settings.singleValue.value, 'updated value');
		// Verify updatedAt was set
		assert.ok(mockStorageItem.settings.singleValue.updatedAt !== undefined);
	});

	it('updateValueThrowsErrorForNonExistentSetting', async () => {
		const settingUpdater = new SettingUpdater(mockProxiedApp, mockSettingsManager);

		await assert.rejects(() => settingUpdater.updateValue('nonExistent', 'value'), {
			name: 'Error',
			message: 'Setting "nonExistent" not found for app test-app-id',
		});
	});

	it('updateSelectOptionsSuccessfully', async () => {
		const updateAppSettingSpy = mock.method(mockSettingsManager, 'updateAppSetting');
		const settingUpdater = new SettingUpdater(mockProxiedApp, mockSettingsManager);
		const newValues = [
			{ key: 'key3', i18nLabel: 'value3' },
			{ key: 'key4', i18nLabel: 'value4' },
		];

		await settingUpdater.updateSelectOptions('multiValue', newValues);

		assert.ok(updateAppSettingSpy.mock.calls.length > 0);
		const updatedValues = mockStorageItem.settings.multiValue.values;
		// Should completely replace old values
		assert.strictEqual((updatedValues ?? []).length, 2);
		assert.deepStrictEqual(updatedValues, newValues);
		// Verify updatedAt was set
		assert.ok(mockStorageItem.settings.multiValue.updatedAt !== undefined);
	});

	it('updateSelectOptionsThrowsErrorForNonExistentSetting', async () => {
		const settingUpdater = new SettingUpdater(mockProxiedApp, mockSettingsManager);

		await assert.rejects(() => settingUpdater.updateSelectOptions('nonExistent', [{ key: 'test', i18nLabel: 'value' }]), {
			name: 'Error',
			message: 'Setting "nonExistent" not found for app test-app-id',
		});
	});
});
