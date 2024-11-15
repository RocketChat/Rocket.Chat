import type { IOAuthApp } from '../../definition/accessors/IOAuthApp';
import type { IOAuthAppsReader } from '../../definition/accessors/IOAuthAppsReader';
import type { OAuthAppsBridge } from '../bridges/OAuthAppsBridge';
export declare class OAuthAppsReader implements IOAuthAppsReader {
    private readonly oauthAppsBridge;
    private readonly appId;
    constructor(oauthAppsBridge: OAuthAppsBridge, appId: string);
    getOAuthAppById(id: string): Promise<IOAuthApp>;
    getOAuthAppByName(name: string): Promise<Array<IOAuthApp>>;
}
