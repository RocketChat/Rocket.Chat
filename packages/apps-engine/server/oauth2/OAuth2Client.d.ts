import { URL } from 'url';
import type { App } from '../../definition/App';
import type { IConfigurationExtend, IPersistence } from '../../definition/accessors';
import type { IAuthData, IOAuth2Client, IOAuth2ClientOptions } from '../../definition/oauth2/IOAuth2';
import type { IUser } from '../../definition/users';
export declare enum GrantType {
    RefreshToken = "refresh_token",
    AuthorizationCode = "authorization_code"
}
export declare class OAuth2Client implements IOAuth2Client {
    private readonly app;
    private readonly config;
    private defaultContents;
    constructor(app: App, config: IOAuth2ClientOptions);
    setup(configuration: IConfigurationExtend): Promise<void>;
    getUserAuthorizationUrl(user: IUser, scopes?: Array<string>): Promise<URL>;
    getAccessTokenForUser(user: IUser): Promise<IAuthData | undefined>;
    refreshUserAccessToken(user: IUser, persis: IPersistence): Promise<IAuthData | undefined>;
    revokeUserAccessToken(user: IUser, persis: IPersistence): Promise<boolean>;
    private getBaseURLWithoutTrailingSlash;
    private handleOAuthCallback;
    private saveToken;
    private removeToken;
}
