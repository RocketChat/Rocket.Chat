import type { URL } from 'url';

import type { IConfigurationExtend, IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IUser } from '../users/IUser';

/**
 * Authorization data as provided after
 * token exchange
 */
export interface IAuthData {
    /**
     * Access token from application
     */
    token: string;
    /**
     * The token's expiration time in seconds
     */
    expiresAt: number;
    /**
     * Scope(s) authorized by the user.
     *
     * Format can change depending on provider, but usually
     * when there are more than one scope, they are separated
     * by a white-space caracter
     */
    scope: string;
    /**
     * A token that can be used to request a new access token
     * when the current one has expired.
     *
     * Not all providers have a refresh token.
     */
    refreshToken?: string;
}

/**
 * Options passed to the OAuth2Client object during instantiation.
 * Describes URLs of the authorization service and optional behavior
 * for when user responds to the authorization prompt
 */
export interface IOAuth2ClientOptions {
    /**
     * Alias for the client. This is used to identify the client's resources.
     * It is used to avoid overwriting other clients' settings or endpoints
     * when there are multiple.
     */
    alias: string;
    /**
     * URI to request an access token from
     */
    accessTokenUri: string;
    /**
     * URI to redirect user for them to authorize access
     * by the application
     */
    authUri: string;
    /**
     * URI to request a refreshed access token for user
     */
    refreshTokenUri: string;
    /**
     * URI to revoke an access token for the user
     */
    revokeTokenUri: string;

    /**
     * Default scopes to be used when requesting access
     */
    defaultScopes?: Array<string>;
    /**
     * A function that will be executed when the auth
     * service redirects the user back to our endpoint.
     */
    authorizationCallback?: (
        token: IAuthData | undefined,
        user: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ) => Promise<{ responseContent?: string } | undefined>;
}

export interface IOAuth2Client {
    /**
     * This method will set all necessary configuration for the client
     *
     * Please note that you will need to provide the i18n strings for the
     * settings created. For instance, if you're connecting to Github APIs
     * and your `alias = 'github'`, you will need to provide the following
     * translations:
     *
     * ```
     * {
     *      "github-oauth-client-id": "Client ID to connect to Github",
     *      "github-oauth-clientsecret": "Client secret to connect to Github"
     * }
     * ```
     *
     * @param configuration - Configuration extend to set all settings and API endpoints
     */
    setup(configuration: IConfigurationExtend): Promise<void>;

    /**
     * Returns the authorization URL to which the user must
     * be redirected to in order to authorize access by the
     * application
     *
     * @param user - User to authenticate
     * @param scopes - Scopes that your app needs access to
     */
    getUserAuthorizationUrl(user: IUser, scopes?: Array<string>): Promise<URL>;

    /**
     * Gets the token information for a specific user, if available.
     *
     * @param user
     */
    getAccessTokenForUser(user: IUser): Promise<IAuthData | undefined>;

    /**
     * Refreshes the user's access token
     *
     * @param user The user whose token will be refreshed
     * @param persis Persistence object dependency
     */
    refreshUserAccessToken(user: IUser, persis: IPersistence): Promise<IAuthData | undefined>;

    /**
     * Revokes user's access token in the service provider
     *
     * @param user The user whose token will be revoked
     * @param persis Persistence object dependency
     */
    revokeUserAccessToken(user: IUser, persis: IPersistence): Promise<boolean>;
}
