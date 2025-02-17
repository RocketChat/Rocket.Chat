import { BaseBridge } from './BaseBridge';
import type { ISetting } from '../../definition/settings';
export declare abstract class ServerSettingBridge extends BaseBridge {
    doGetAll(appId: string): Promise<Array<ISetting>>;
    doGetOneById(id: string, appId: string): Promise<ISetting>;
    doHideGroup(name: string, appId: string): Promise<void>;
    doHideSetting(id: string, appId: string): Promise<void>;
    doIsReadableById(id: string, appId: string): Promise<boolean>;
    doUpdateOne(setting: ISetting, appId: string): Promise<void>;
    doIncrementValue(id: ISetting['id'], value: number, appId: string): Promise<void>;
    protected abstract getAll(appId: string): Promise<Array<ISetting>>;
    protected abstract getOneById(id: string, appId: string): Promise<ISetting>;
    protected abstract hideGroup(name: string, appId: string): Promise<void>;
    protected abstract hideSetting(id: string, appId: string): Promise<void>;
    protected abstract isReadableById(id: string, appId: string): Promise<boolean>;
    protected abstract updateOne(setting: ISetting, appId: string): Promise<void>;
    protected abstract incrementValue(id: ISetting['id'], value: number, appId: string): Promise<void>;
    private hasWritePermission;
    private hasReadPermission;
}
