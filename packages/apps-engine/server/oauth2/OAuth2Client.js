"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth2Client = exports.GrantType = void 0;
const url_1 = require("url");
const accessors_1 = require("../../definition/accessors");
const api_1 = require("../../definition/api");
const metadata_1 = require("../../definition/metadata");
const settings_1 = require("../../definition/settings");
var GrantType;
(function (GrantType) {
    GrantType["RefreshToken"] = "refresh_token";
    GrantType["AuthorizationCode"] = "authorization_code";
})(GrantType || (exports.GrantType = GrantType = {}));
class OAuth2Client {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.defaultContents = {
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
    }
    setup(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            configuration.api.provideApi({
                security: api_1.ApiSecurity.UNSECURE,
                visibility: api_1.ApiVisibility.PUBLIC,
                endpoints: [
                    {
                        path: `${this.config.alias}-callback`,
                        get: this.handleOAuthCallback.bind(this),
                    },
                ],
            });
            yield Promise.all([
                configuration.settings.provideSetting({
                    id: `${this.config.alias}-oauth-client-id`,
                    type: settings_1.SettingType.STRING,
                    public: true,
                    required: true,
                    packageValue: '',
                    i18nLabel: `${this.config.alias}-oauth-client-id`,
                }),
                configuration.settings.provideSetting({
                    id: `${this.config.alias}-oauth-clientsecret`,
                    type: settings_1.SettingType.STRING,
                    public: true,
                    required: true,
                    packageValue: '',
                    i18nLabel: `${this.config.alias}-oauth-client-secret`,
                }),
            ]);
        });
    }
    getUserAuthorizationUrl(user, scopes) {
        return __awaiter(this, void 0, void 0, function* () {
            const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);
            const siteUrl = yield this.getBaseURLWithoutTrailingSlash();
            const finalScopes = [].concat(this.config.defaultScopes || [], scopes || []);
            const { authUri } = this.config;
            const clientId = yield this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);
            const url = new url_1.URL(authUri, siteUrl);
            url.searchParams.set('response_type', 'code');
            url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
            url.searchParams.set('state', user.id);
            url.searchParams.set('client_id', clientId);
            url.searchParams.set('access_type', 'offline');
            if (finalScopes.length > 0) {
                url.searchParams.set('scope', finalScopes.join(' '));
            }
            return url;
        });
    }
    getAccessTokenForUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const associations = [
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.USER, user.id),
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
            ];
            const [result] = (yield this.app.getAccessors().reader.getPersistenceReader().readByAssociations(associations));
            return result;
        });
    }
    refreshUserAccessToken(user, persis) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenInfo = yield this.getAccessTokenForUser(user);
                if (!tokenInfo) {
                    throw new Error('User has no access token information');
                }
                if (!tokenInfo.refreshToken) {
                    throw new Error('User token information has no refresh token available');
                }
                const { config: { refreshTokenUri }, } = this;
                const clientId = yield this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);
                const clientSecret = yield this.app
                    .getAccessors()
                    .reader.getEnvironmentReader()
                    .getSettings()
                    .getValueById(`${this.config.alias}-oauth-clientsecret`);
                const siteUrl = yield this.getBaseURLWithoutTrailingSlash();
                const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);
                const url = new url_1.URL(refreshTokenUri);
                url.searchParams.set('client_id', clientId);
                url.searchParams.set('client_secret', clientSecret);
                url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
                url.searchParams.set('refresh_token', tokenInfo.refreshToken);
                url.searchParams.set('grant_type', GrantType.RefreshToken);
                const { content, statusCode } = yield this.app.getAccessors().http.post(url.href);
                if (statusCode !== 200) {
                    throw new Error('Request to provider was unsuccessful. Check logs for more information');
                }
                const { access_token, expires_in, refresh_token, scope } = JSON.parse(content);
                if (!access_token) {
                    throw new Error('No access token returned by the provider');
                }
                const authData = {
                    scope,
                    token: access_token,
                    expiresAt: expires_in,
                    refreshToken: refresh_token || tokenInfo.refreshToken,
                };
                yield this.saveToken(authData, user.id, persis);
                return authData;
            }
            catch (error) {
                this.app.getLogger().error(error);
                throw error;
            }
        });
    }
    revokeUserAccessToken(user, persis) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenInfo = yield this.getAccessTokenForUser(user);
                if (!(tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.token)) {
                    throw new Error('No access token available for this user.');
                }
                const url = new url_1.URL(this.config.revokeTokenUri);
                url.searchParams.set('token', tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.token);
                const result = yield this.app.getAccessors().http.post(url.href);
                if (result.statusCode !== 200) {
                    throw new Error('Provider did not allow token to be revoked');
                }
                yield this.removeToken({ userId: user.id, persis });
                return true;
            }
            catch (error) {
                this.app.getLogger().error(error);
                return false;
            }
        });
    }
    getBaseURLWithoutTrailingSlash() {
        return __awaiter(this, void 0, void 0, function* () {
            const SITE_URL = 'Site_Url';
            const url = yield this.app.getAccessors().environmentReader.getServerSettings().getValueById(SITE_URL);
            if (url.endsWith('/')) {
                return url.substr(0, url.length - 1);
            }
            return url;
        });
    }
    handleOAuthCallback(request, endpoint, read, modify, http, persis) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const { query: { code, state }, } = request;
                const user = yield this.app.getAccessors().reader.getUserReader().getById(state);
                if (!user) {
                    throw new Error('User could not be determined.');
                }
                // User chose not to authorize the access
                if (!code) {
                    const failedResult = yield ((_b = (_a = this.config).authorizationCallback) === null || _b === void 0 ? void 0 : _b.call(_a, undefined, user, read, modify, http, persis));
                    return {
                        status: accessors_1.HttpStatusCode.UNAUTHORIZED,
                        content: (failedResult === null || failedResult === void 0 ? void 0 : failedResult.responseContent) || this.defaultContents.failed,
                    };
                }
                const siteUrl = yield this.getBaseURLWithoutTrailingSlash();
                const accessTokenUrl = this.config.accessTokenUri;
                const redirectUri = this.app.getAccessors().providedApiEndpoints[0].computedPath.substring(1);
                const clientId = yield this.app.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(`${this.config.alias}-oauth-client-id`);
                const clientSecret = yield this.app
                    .getAccessors()
                    .reader.getEnvironmentReader()
                    .getSettings()
                    .getValueById(`${this.config.alias}-oauth-clientsecret`);
                const url = new url_1.URL(accessTokenUrl, siteUrl);
                url.searchParams.set('client_id', clientId);
                url.searchParams.set('redirect_uri', `${siteUrl}/${redirectUri}`);
                url.searchParams.set('code', code);
                url.searchParams.set('client_secret', clientSecret);
                url.searchParams.set('access_type', 'offline');
                url.searchParams.set('grant_type', GrantType.AuthorizationCode);
                const { content, statusCode } = yield http.post(url.href, {
                    headers: { Accept: 'application/json' },
                });
                // If provider had a server error, nothing we can do
                if (statusCode >= 500) {
                    throw new Error('Request for access token failed. Check logs for more information');
                }
                const response = JSON.parse(content);
                const { access_token, expires_in, refresh_token, scope } = response;
                const authData = {
                    scope,
                    token: access_token,
                    expiresAt: expires_in,
                    refreshToken: refresh_token,
                };
                const result = yield ((_d = (_c = this.config).authorizationCallback) === null || _d === void 0 ? void 0 : _d.call(_c, authData, user, read, modify, http, persis));
                yield this.saveToken(authData, user.id, persis);
                return {
                    status: statusCode,
                    content: (result === null || result === void 0 ? void 0 : result.responseContent) || this.defaultContents.success,
                };
            }
            catch (error) {
                this.app.getLogger().error(error);
                return {
                    status: accessors_1.HttpStatusCode.INTERNAL_SERVER_ERROR,
                    content: this.defaultContents.failed,
                };
            }
        });
    }
    saveToken(authData, userId, persis) {
        return __awaiter(this, void 0, void 0, function* () {
            const { scope, token, expiresAt, refreshToken } = authData;
            return persis.updateByAssociations([
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.USER, userId),
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
            ], {
                scope,
                token,
                expiresAt: expiresAt || '',
                refreshToken: refreshToken || '',
            }, true);
        });
    }
    removeToken(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, persis }) {
            const [result] = (yield persis.removeByAssociations([
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.USER, userId),
                new metadata_1.RocketChatAssociationRecord(metadata_1.RocketChatAssociationModel.MISC, `${this.config.alias}-oauth-connection`),
            ]));
            return result;
        });
    }
}
exports.OAuth2Client = OAuth2Client;
//# sourceMappingURL=OAuth2Client.js.map