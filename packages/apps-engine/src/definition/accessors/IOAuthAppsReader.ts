import type { IOAuthApp } from './IOAuthApp';

export interface IOAuthAppsReader {
    /**
     * Returns the OAuth app info by its id
     * @param id - OAuth app id
     * @param appId - the app id
     */
    getOAuthAppById(id: string, appId: string): Promise<IOAuthApp>;
    /**
     * Returns the OAuth app info by its name
     * @param name - OAuth app name
     * @param appId - the app id
     */
    getOAuthAppByName(name: string, appId: string): Promise<Array<IOAuthApp>>;
}
