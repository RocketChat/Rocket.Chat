import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { SettingUpdater } from '../../../src/server/accessors';
import type { AppSettingsManager } from '../../../src/server/managers';
import type { IAppStorageItem } from '../../../src/server/storage';
import { TestData } from '../../test-data/utilities';

export class SettingUpdaterAccessorTestFixture {
    private mockStorageItem: IAppStorageItem;

    private mockProxiedApp: ProxiedApp;

    private mockSettingsManager: AppSettingsManager;

    @SetupFixture
    public setupFixture() {
        // Set up mock storage with test settings
        this.mockStorageItem = {
            settings: {},
        } as IAppStorageItem;

        this.mockStorageItem.settings.singleValue = TestData.getSetting('singleValue');
        this.mockStorageItem.settings.multiValue = {
            ...TestData.getSetting('multiValue'),
            values: [
                { key: 'key1', i18nLabel: 'value1' },
                { key: 'key2', i18nLabel: 'value2' },
            ],
        };

        // Mock ProxiedApp
        const si = this.mockStorageItem;
        this.mockProxiedApp = {
            getStorageItem(): IAppStorageItem {
                return si;
            },
            getID(): string {
                return 'test-app-id';
            },
        } as ProxiedApp;

        // Mock AppSettingsManager
        this.mockSettingsManager = {} as AppSettingsManager;
        this.mockSettingsManager.getAppSetting = (appId: string, settingId: string) => {
            return this.mockStorageItem.settings[settingId];
        };
        this.mockSettingsManager.updateAppSetting = (appId: string, setting: any) => {
            this.mockStorageItem.settings[setting.id] = setting;
            return Promise.resolve();
        };

        SpyOn(this.mockSettingsManager, 'getAppSetting');
        SpyOn(this.mockSettingsManager, 'updateAppSetting');
    }

    @AsyncTest()
    public async updateValueSuccessfully() {
        const settingUpdater = new SettingUpdater(this.mockProxiedApp, this.mockSettingsManager);

        await settingUpdater.updateValue('singleValue', 'updated value');

        Expect(this.mockSettingsManager.updateAppSetting).toHaveBeenCalled();
        Expect(this.mockStorageItem.settings.singleValue.value).toBe('updated value');
        // Verify updatedAt was set
        Expect(this.mockStorageItem.settings.singleValue.updatedAt).toBeDefined();
    }

    @AsyncTest()
    public async updateValueThrowsErrorForNonExistentSetting() {
        const settingUpdater = new SettingUpdater(this.mockProxiedApp, this.mockSettingsManager);

        await Expect(() => settingUpdater.updateValue('nonExistent', 'value')).toThrowErrorAsync(Error, 'Setting "nonExistent" not found for app test-app-id');
    }

    @AsyncTest()
    public async updateSelectOptionsSuccessfully() {
        const settingUpdater = new SettingUpdater(this.mockProxiedApp, this.mockSettingsManager);
        const newValues = [
            { key: 'key3', i18nLabel: 'value3' },
            { key: 'key4', i18nLabel: 'value4' },
        ];

        await settingUpdater.updateSelectOptions('multiValue', newValues);

        Expect(this.mockSettingsManager.updateAppSetting).toHaveBeenCalled();
        const updatedValues = this.mockStorageItem.settings.multiValue.values;
        // Should completely replace old values
        Expect((updatedValues ?? []).length).toBe(2);
        Expect(updatedValues).toEqual(newValues);
        // Verify updatedAt was set
        Expect(this.mockStorageItem.settings.multiValue.updatedAt).toBeDefined();
    }

    @AsyncTest()
    public async updateSelectOptionsThrowsErrorForNonExistentSetting() {
        const settingUpdater = new SettingUpdater(this.mockProxiedApp, this.mockSettingsManager);

        await Expect(() => settingUpdater.updateSelectOptions('nonExistent', [{ key: 'test', i18nLabel: 'value' }])).toThrowErrorAsync(
            Error,
            'Setting "nonExistent" not found for app test-app-id',
        );
    }
}
