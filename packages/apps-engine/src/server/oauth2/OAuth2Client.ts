import { URL } from 'url';

import type { App } from '../../definition/App';
import type { IConfigurationExtend, IHttp, IModify, IPersistence, IRead } from '../../definition/accessors';
import { HttpStatusCode } from '../../definition/accessors';
import type { IApiEndpointInfo, IApiRequest, IApiResponse } from '../../definition/api';
import { ApiSecurity, ApiVisibility } from '../../definition/api';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '../../definition/metadata';
import type { IAuthData, IOAuth2Client, IOAuth2ClientOptions } from '../../definition/oauth2/IOAuth2';
import { SettingType } from '../../definition/settings';
import type { IUser } from '../../definition/users';

export enum GrantType {
    RefreshToken = 'refresh_token',
    AuthorizationCode = 'authorization_code',
}

export class OAuth2Client implements IOAuth2Client {
    private defaultContents = {
        success: `<div style="display: flex;align-items: center;justify-content: center; height: 100%;">\
                        <h1 style="text-align: center; font-family: Helvetica Neue;">\
                            Authorization went successfully<br>\
                            You can close this tab now<br>\
                        </h1>\
                    </div>`,
        failed: `<div style="display: flex;align-items: center;justify-content: center; height: 100%;">\
                    <h1 style="text-align: center; font-family: Helvetica Neue;">\
                        Oops, something went wrong, please try again or in case it still does not work, contact the administrator.\
                    </h1>\
                </div>`,
    };

    constructor(
        private readonly app: App,
        private readonly config: IOAuth2ClientOptions,
    ) {}

    public async setup(configuration: IConfigurationExtend): Promise<void> {
        configuration.api.provideApi({
            security: ApiSecurity.UNSECURE,
            visibility: ApiVisibility.PUBLIC,
            endpoints: [
                {
                    path: `${this.config.alias}-callback`,
                    get: this.handleOAuthCallback.bind(this),
                },
            ],
        });

        await Promise.all([
            configuration.settings.provideSetting({
                id: `${this.config.alias}-oauth-client-id`,
                type: SettingType.STRING,
                public: true,
                required: true,
                packageValue: '',
                i18nLabel: `${this.config.alias}-oauth-client-id`,
            }),

            configuration.settings.provideSetting({
                id: `${this.config.alias}-oauth-clientsecret`,
                type: SettingType.STRING,
                public: true,
                required: true,
                packageValue: '',
                i18nLabel: `${this.config.alias}-oauth-client-secret`,
            }),
        ]);
    }

    public async getUserAuthorizationUrl(user: IUser, scopes?: Array<string>): Promise<URL> {
        const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);

        const siteUrl = await this.getBaseURLWithoutTrailingSlash();

        const finalScopes = ([] as Array<string>).concat(this.config.defaultScopes || [], scopes || []);

        const { authUri } = this.config;

        const clientId = await this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);

        const url = new URL(authUri, siteUrl);

        url.searchParams.set('response_type', 'code');
        url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
        url.searchParams.set('state', user.id);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('access_type', 'offline');

        if (finalScopes.length > 0) {
            url.searchParams.set('scope', finalScopes.join(' '));
        }

        return url;
    }

    public async getAccessTokenForUser(user: IUser): Promise<IAuthData | undefined> {
        const associations = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
        ];

        const [result] = (await this.app.getAccessors().reader.getPersistenceReader().readByAssociations(associations)) as unknown as Array<
            IAuthData | undefined
        >;

        return result;
    }

    public async refreshUserAccessToken(user: IUser, persis: IPersistence): Promise<IAuthData | undefined> {
        try {
            const tokenInfo = await this.getAccessTokenForUser(user);

            if (!tokenInfo) {
                throw new Error('User has no access token information');
            }

            if (!tokenInfo.refreshToken) {
                throw new Error('User token information has no refresh token available');
            }

            const {
                config: { refreshTokenUri },
            } = this;

            const clientId = await this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);

            const clientSecret = await this.app
                .getAccessors()
                .reader.getEnvironmentReader()
                .getSettings()
                .getValueById(`${this.config.alias}-oauth-clientsecret`);

            const siteUrl = await this.getBaseURLWithoutTrailingSlash();

            const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);

            const url = new URL(refreshTokenUri);

            url.searchParams.set('client_id', clientId);
            url.searchParams.set('client_secret', clientSecret);
            url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
            url.searchParams.set('refresh_token', tokenInfo.refreshToken);
            url.searchParams.set('grant_type', GrantType.RefreshToken);

            const { content, statusCode } = await this.app.getAccessors().http.post(url.href);

            if (statusCode !== 200) {
                throw new Error('Request to provider was unsuccessful. Check logs for more information');
            }

            const { access_token, expires_in, refresh_token, scope } = JSON.parse(content as string);

            if (!access_token) {
                throw new Error('No access token returned by the provider');
            }

            const authData: IAuthData = {
                scope,
                token: access_token,
                expiresAt: expires_in,
                refreshToken: refresh_token || tokenInfo.refreshToken,
            };

            await this.saveToken(authData, user.id, persis);

            return authData;
        } catch (error) {
            this.app.getLogger().error(error);
            throw error;
        }
    }

    public async revokeUserAccessToken(user: IUser, persis: IPersistence): Promise<boolean> {
        try {
            const tokenInfo = await this.getAccessTokenForUser(user);

            if (!tokenInfo?.token) {
                throw new Error('No access token available for this user.');
            }

            const url = new URL(this.config.revokeTokenUri);

            url.searchParams.set('token', tokenInfo?.token);

            const result = await this.app.getAccessors().http.post(url.href);

            if (result.statusCode !== 200) {
                throw new Error('Provider did not allow token to be revoked');
            }

            await this.removeToken({ userId: user.id, persis });

            return true;
        } catch (error) {
            this.app.getLogger().error(error);
            return false;
        }
    }

    private async getBaseURLWithoutTrailingSlash(): Promise<string> {
        const SITE_URL = 'Site_Url';
        const url = await this.app.getAccessors().environmentReader.getServerSettings().getValueById(SITE_URL);

        if (url.endsWith('/')) {
            return url.substr(0, url.length - 1);
        }
        return url;
    }

    private async handleOAuthCallback(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse> {
        try {
            const {
                query: { code, state },
            } = request;

            const user = await this.app.getAccessors().reader.getUserReader().getById(state);

            if (!user) {
                throw new Error('User could not be determined.');
            }

            // User chose not to authorize the access
            if (!code) {
                const failedResult = await this.config.authorizationCallback?.(undefined, user, read, modify, http, persis);

                return {
                    status: HttpStatusCode.UNAUTHORIZED,
                    content: failedResult?.responseContent || this.defaultContents.failed,
                };
            }

            const siteUrl = await this.getBaseURLWithoutTrailingSlash();

            const accessTokenUrl = this.config.accessTokenUri;

            const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);

            const clientId = await this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);

            const clientSecret = await this.app
                .getAccessors()
                .reader.getEnvironmentReader()
                .getSettings()
                .getValueById(`${this.config.alias}-oauth-clientsecret`);

            const url = new URL(accessTokenUrl, siteUrl);

            url.searchParams.set('client_id', clientId);
            url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
            url.searchParams.set('code', code);
            url.searchParams.set('client_secret', clientSecret);
            url.searchParams.set('access_type', 'offline');
            url.searchParams.set('grant_type', GrantType.AuthorizationCode);

            const { content, statusCode } = await http.post(url.href, {
                headers: { Accept: 'application/json' },
            });

            // If provider had a server error, nothing we can do
            if (statusCode >= 500) {
                throw new Error('Request for access token failed. Check logs for more information');
            }

            const response = JSON.parse(content as string);
            const { access_token, expires_in, refresh_token, scope } = response;

            const authData: IAuthData = {
                scope,
                token: access_token,
                expiresAt: expires_in,
                refreshToken: refresh_token,
            };

            const result = await this.config.authorizationCallback?.(authData, user, read, modify, http, persis);

            await this.saveToken(authData, user.id, persis);

            return {
                status: statusCode,
                content: result?.responseContent || this.defaultContents.success,
            };
        } catch (error) {
            this.app.getLogger().error(error);
            return {
                status: HttpStatusCode.INTERNAL_SERVER_ERROR,
                content: this.defaultContents.failed,
            };
        }
    }

    private async saveToken(authData: IAuthData, userId: string, persis: IPersistence): Promise<string> {
        const { scope, token, expiresAt, refreshToken } = authData;

        return persis.updateByAssociations(
            [
                new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
            ],
            {
                scope,
                token,
                expiresAt: expiresAt || '',
                refreshToken: refreshToken || '',
            },
            true, // we want to create the record if it doesn't exist
        );
    }

    private async removeToken({ userId, persis }: { userId: string; persis: IPersistence }): Promise<IAuthData> {
        const [result] = (await persis.removeByAssociations([
            new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
        ])) as unknown as Array<IAuthData>;

        return result;
    }
}
