import { AsyncTest, Expect, Test } from 'alsatian';

import type { ISetting } from '../../../src/definition/settings';
import { SettingType } from '../../../src/definition/settings';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { SettingsExtend } from '../../../src/server/accessors';
import type { IAppStorageItem } from '../../../src/server/storage';

export class SettingsExtendAccessorTestFixture {
    @Test()
    public basicSettingsExtend() {
        Expect(() => new SettingsExtend({} as ProxiedApp)).not.toThrow();
    }

    @AsyncTest()
    public async provideSettingToSettingsExtend(): Promise<void> {
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

        await Expect(() => se.provideSetting(setting)).not.toThrowAsync();
        Expect(mockedStorageItem.settings).not.toBeEmpty();

        const settingModified: ISetting = {
            id: 'testing',
            type: SettingType.STRING,
            packageValue: 'thing',
            required: false,
            public: false,
            i18nLabel: 'Testing_Thing',
            value: 'dont-use-me',
        };
        await Expect(() => se.provideSetting(settingModified)).not.toThrowAsync();
        Expect(mockedStorageItem.settings.testing).toBeDefined();
        Expect(mockedStorageItem.settings.testing.value).not.toBeDefined();
        Expect(mockedStorageItem.settings.testing.i18nLabel).toBe('Testing_Thing');
    }
}
