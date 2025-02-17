import type { ISettingUpdater } from '../../definition/accessors/ISettingUpdater';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppSettingsManager } from '../managers';
export declare class SettingUpdater implements ISettingUpdater {
    private readonly app;
    private readonly manager;
    constructor(app: ProxiedApp, manager: AppSettingsManager);
    updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void>;
}
