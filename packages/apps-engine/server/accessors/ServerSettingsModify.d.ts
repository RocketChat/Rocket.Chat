import type { IServerSettingsModify } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ServerSettingBridge } from '../bridges/ServerSettingBridge';
export declare class ServerSettingsModify implements IServerSettingsModify {
    private readonly bridge;
    private readonly appId;
    constructor(bridge: ServerSettingBridge, appId: string);
    hideGroup(name: string): Promise<void>;
    hideSetting(id: string): Promise<void>;
    modifySetting(setting: ISetting): Promise<void>;
    incrementValue(id: ISetting['id'], value?: number): Promise<void>;
}
