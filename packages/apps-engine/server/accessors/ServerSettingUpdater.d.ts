import type { IServerSettingUpdater } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { AppBridges } from '../bridges';
export declare class ServerSettingUpdater implements IServerSettingUpdater {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    updateOne(setting: ISetting): Promise<void>;
    incrementValue(id: ISetting['id'], value?: number): Promise<void>;
}
