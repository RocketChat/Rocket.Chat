import type { IOAuthAppParams } from '../../definition/accessors/IOAuthApp';
import type { IOAuthAppsModify } from '../../definition/accessors/IOAuthAppsModify';
import type { OAuthAppsBridge } from '../bridges/OAuthAppsBridge';

export class OAuthAppsModify implements IOAuthAppsModify {
    constructor(private readonly oauthAppsBridge: OAuthAppsBridge, private readonly appId: string) {}

    public async createOAuthApp(oAuthApp: IOAuthAppParams): Promise<string> {
        return this.oauthAppsBridge.doCreate(oAuthApp, this.appId);
    }

    public async updateOAuthApp(oAuthApp: IOAuthAppParams, id: string): Promise<void> {
        return this.oauthAppsBridge.doUpdate(oAuthApp, id, this.appId);
    }

    public async deleteOAuthApp(id: string): Promise<void> {
        return this.oauthAppsBridge.doDelete(id, this.appId);
    }
}
