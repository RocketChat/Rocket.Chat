import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import { TestData } from '../../test-data/utilities';
import { SettingRead } from '../../../src/server/accessors';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { IAppStorageItem } from '../../../src/server/storage';

export class SettingReadAccessorTestFixture {
    private mockStorageItem: IAppStorageItem;

    private mockProxiedApp: ProxiedApp;

    @SetupFixture
    public setupFixture() {
        this.mockStorageItem = {
            settings: {},
        } as IAppStorageItem;
        this.mockStorageItem.settings.testing = TestData.getSetting('testing');

        const si = this.mockStorageItem;
        this.mockProxiedApp = {
            getStorageItem(): IAppStorageItem {
                return si;
            },
        } as ProxiedApp;
    }

    @AsyncTest()
    public async appSettingRead() {
        Expect(() => new SettingRead({} as ProxiedApp)).not.toThrow();

        const sr = new SettingRead(this.mockProxiedApp);
        Expect(await sr.getById('testing')).toBeDefined();
        Expect(await sr.getById('testing')).toEqual(TestData.getSetting('testing'));
        Expect(await sr.getValueById('testing')).toBe('The packageValue');
        this.mockStorageItem.settings.testing.value = 'my value';
        Expect(await sr.getValueById('testing')).toBe('my value');
        await Expect(() => sr.getValueById('superfake')).toThrowErrorAsync(Error, 'Setting "superfake" does not exist.');
    }
}
