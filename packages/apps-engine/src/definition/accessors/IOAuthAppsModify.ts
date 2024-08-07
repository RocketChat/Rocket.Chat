import type { IOAuthAppParams } from './IOAuthApp';

export interface IOAuthAppsModify {
    /**
     * Create an OAuthApp
     * @param OAuthApp - the OAuth app to create, in case the clientId and the clientSecret is not sent it will generate automatically
     * @param appId - the app id
     */
    createOAuthApp(OAuthApp: IOAuthAppParams, appId: string): Promise<string>;
    /**
     * Update the OAuth app info
     * @param OAuthApp - OAuth data that will be updated
     * @param id - OAuth app id
     * @param appId - the app id
     */
    updateOAuthApp(OAuthApp: IOAuthAppParams, id: string, appId: string): Promise<void>;
    /**
     * Deletes the OAuth app
     * @param id - OAuth app id
     * @param appId - the app id
     */
    deleteOAuthApp(id: string, appId: string): Promise<void>;
}
