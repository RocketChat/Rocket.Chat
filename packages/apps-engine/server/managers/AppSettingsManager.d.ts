import type { ISetting } from '../../definition/settings';
import type { AppManager } from '../AppManager';
export declare class AppSettingsManager {
    private manager;
    constructor(manager: AppManager);
    getAppSettings(appId: string): {
        [key: string]: ISetting;
    };
    getAppSetting(appId: string, settingId: string): ISetting;
    updateAppSetting(appId: string, setting: ISetting): Promise<void>;
}
