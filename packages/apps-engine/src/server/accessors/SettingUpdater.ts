import type { ISettingUpdater } from '../../definition/accessors/ISettingUpdater';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppSettingsManager } from '../managers';

export class SettingUpdater implements ISettingUpdater {
    constructor(private readonly app: ProxiedApp, private readonly manager: AppSettingsManager) {}

    public async updateValue(id: ISetting['id'], value: ISetting['value']) {
        if (!this.app.getStorageItem().settings[id]) {
            return;
        }

        const setting = this.manager.getAppSetting(this.app.getID(), id);

        this.manager.updateAppSetting(this.app.getID(), {
            ...setting,
            updatedAt: new Date(),
            value,
        });
    }
}
