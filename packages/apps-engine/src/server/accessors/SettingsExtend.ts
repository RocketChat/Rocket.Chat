import type { ISettingsExtend } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';

export class SettingsExtend implements ISettingsExtend {
    constructor(private readonly app: ProxiedApp) {}

    public async provideSetting(setting: ISetting): Promise<void> {
        if (this.app.getStorageItem().settings[setting.id]) {
            // :see_no_evil:
            const old = await Promise.resolve(this.app.getStorageItem().settings[setting.id]);

            setting.createdAt = old.createdAt;
            setting.updatedAt = new Date();
            setting.value = old.value;

            this.app.getStorageItem().settings[setting.id] = setting;

            return;
        }

        setting.createdAt = new Date();
        setting.updatedAt = new Date();
        this.app.getStorageItem().settings[setting.id] = setting;
    }
}
