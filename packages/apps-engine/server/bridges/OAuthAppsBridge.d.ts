import { BaseBridge } from './BaseBridge';
import type { IOAuthApp, IOAuthAppParams } from '../../definition/accessors/IOAuthApp';
export declare abstract class OAuthAppsBridge extends BaseBridge {
    doCreate(oAuthApp: IOAuthAppParams, appId: string): Promise<string>;
    doGetByid(id: string, appId: string): Promise<IOAuthApp>;
    doGetByName(name: string, appId: string): Promise<IOAuthApp[]>;
    doUpdate(oAuthApp: IOAuthAppParams, id: string, appId: string): Promise<void>;
    doDelete(id: string, appId: string): Promise<void>;
    doPurge(appId: string): Promise<void>;
    protected abstract create(oAuthApp: IOAuthAppParams, appId: string): Promise<string | null>;
    protected abstract getById(id: string, appId: string): Promise<IOAuthApp | null>;
    protected abstract getByName(name: string, appId: string): Promise<Array<IOAuthApp | null>>;
    protected abstract update(oAuthApp: IOAuthAppParams, id: string, appId: string): Promise<void>;
    protected abstract delete(id: string, appId: string): Promise<void>;
    protected abstract purge(appId: string): Promise<void>;
    private hasWritePermission;
    private hasReadPermission;
}
