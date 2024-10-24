import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type { ISetting } from '../../../src/definition/settings';
import { ServerSettingsModify } from '../../../src/server/accessors';
import type { ServerSettingBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class ServerSettingsModifyTestFixture {
    private setting: ISetting;

    private mockAppId: string;

    private mockServerSettingBridge: ServerSettingBridge;

    @SetupFixture
    public setupFixture() {
        this.setting = TestData.getSetting();
        this.mockAppId = 'testing-app';
        this.mockServerSettingBridge = {
            doHideGroup(name: string, appId: string): Promise<void> {
                return Promise.resolve();
            },
            doHideSetting(id: string, appId: string): Promise<void> {
                return Promise.resolve();
            },
            doUpdateOne(setting: ISetting, appId: string): Promise<void> {
                return Promise.resolve();
            },
            doIncrementValue(id: ISetting['id'], value: number, appId: string): Promise<void> {
                return Promise.resolve();
            },
        } as ServerSettingBridge;
    }

    @AsyncTest()
    public async useServerSettingsModify() {
        Expect(() => new ServerSettingsModify(this.mockServerSettingBridge, this.mockAppId)).not.toThrow();

        const sp1 = SpyOn(this.mockServerSettingBridge, 'doHideGroup');
        const sp2 = SpyOn(this.mockServerSettingBridge, 'doHideSetting');
        const sp3 = SpyOn(this.mockServerSettingBridge, 'doUpdateOne');
        const sp4 = SpyOn(this.mockServerSettingBridge, 'doIncrementValue');

        const ssm = new ServerSettingsModify(this.mockServerSettingBridge, this.mockAppId);

        Expect(await ssm.hideGroup('api')).not.toBeDefined();
        Expect(this.mockServerSettingBridge.doHideGroup).toHaveBeenCalledWith('api', this.mockAppId);
        Expect(await ssm.hideSetting('api')).not.toBeDefined();
        Expect(this.mockServerSettingBridge.doHideSetting).toHaveBeenCalledWith('api', this.mockAppId);
        Expect(await ssm.modifySetting(this.setting)).not.toBeDefined();
        Expect(this.mockServerSettingBridge.doUpdateOne).toHaveBeenCalledWith(this.setting, this.mockAppId);
        Expect(await ssm.incrementValue(this.setting.id, 5)).not.toBeDefined();
        Expect(this.mockServerSettingBridge.doIncrementValue).toHaveBeenCalledWith(this.setting.id, 5, this.mockAppId);

        sp1.restore();
        sp2.restore();
        sp3.restore();
        sp4.restore();
    }
}
