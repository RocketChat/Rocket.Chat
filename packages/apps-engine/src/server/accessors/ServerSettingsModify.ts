import type { IServerSettingsModify } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ServerSettingBridge } from '../bridges/ServerSettingBridge';

export class ServerSettingsModify implements IServerSettingsModify {
    constructor(
        private readonly bridge: ServerSettingBridge,
        private readonly appId: string,
    ) {}

    public async hideGroup(name: string): Promise<void> {
        await this.bridge.doHideGroup(name, this.appId);
    }

    public async hideSetting(id: string): Promise<void> {
        await this.bridge.doHideSetting(id, this.appId);
    }

    public async modifySetting(setting: ISetting): Promise<void> {
        await this.bridge.doUpdateOne(setting, this.appId);
    }

    public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
        await this.bridge.doIncrementValue(id, value, this.appId);
    }
}
