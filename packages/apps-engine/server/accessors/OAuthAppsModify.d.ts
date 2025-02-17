import type { IOAuthAppParams } from '../../definition/accessors/IOAuthApp';
import type { IOAuthAppsModify } from '../../definition/accessors/IOAuthAppsModify';
import type { OAuthAppsBridge } from '../bridges/OAuthAppsBridge';
export declare class OAuthAppsModify implements IOAuthAppsModify {
    private readonly oauthAppsBridge;
    private readonly appId;
    constructor(oauthAppsBridge: OAuthAppsBridge, appId: string);
    createOAuthApp(oAuthApp: IOAuthAppParams): Promise<string>;
    updateOAuthApp(oAuthApp: IOAuthAppParams, id: string): Promise<void>;
    deleteOAuthApp(id: string): Promise<void>;
}
