import type { ISettingsExtend } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';
export declare class SettingsExtend implements ISettingsExtend {
    private readonly app;
    constructor(app: ProxiedApp);
    provideSetting(setting: ISetting): Promise<void>;
}
