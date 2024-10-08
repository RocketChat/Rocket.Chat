import type { IOAuthApp, IOAuthAppParams } from '../../../src/definition/accessors/IOAuthApp';
import { OAuthAppsBridge } from '../../../src/server/bridges/OAuthAppsBridge';

export class TestOAuthAppsBridge extends OAuthAppsBridge {
    protected create(oAuthApp: IOAuthAppParams, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    protected getById(id: string, appId: string): Promise<IOAuthApp> {
        throw new Error('Method not implemented.');
    }

    protected getByName(name: string, appId: string): Promise<Array<IOAuthApp>> {
        throw new Error('Method not implemented.');
    }

    protected update(oAuthApp: IOAuthAppParams, id: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected delete(id: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected purge(appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
