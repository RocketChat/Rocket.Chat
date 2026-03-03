import { ServiceConfiguration } from 'meteor/service-configuration';
import { Random } from 'meteor/random';
import { OAuth } from 'meteor/oauth';

export interface GoogleRequestCredentialOptions {
  requestPermissions?: string[];
  requestOfflineToken?: boolean;
  prompt?: string;
  forceApprovalPrompt?: boolean;
  loginHint?: string;
  loginUrlParameters?: Record<string, string>;
  redirectUrl?: string;
}

export type CredentialRequestCompleteCallback = (tokenOrError?: string | Error) => void;

const ILLEGAL_PARAMETERS: Record<string, boolean> = {
  response_type: true,
  client_id: true,
  scope: true,
  redirect_uri: true,
  state: true,
};

export const Google = {
  /**
   * Request Google credentials for the user
   *
   * @param options {optional}
   * @param credentialRequestCompleteCallback {Function} Callback function to call on completion.
   */
  requestCredential(
    options?: GoogleRequestCredentialOptions | CredentialRequestCompleteCallback,
    credentialRequestCompleteCallback?: CredentialRequestCompleteCallback
  ): void {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
      credentialRequestCompleteCallback = options as CredentialRequestCompleteCallback;
      options = {};
    } else if (!options) {
      options = {};
    }

    const opts = options as GoogleRequestCredentialOptions;

    const config = ServiceConfiguration.configurations.findOne({ service: 'google' });
    if (!config) {
      if (credentialRequestCompleteCallback) {
        // Assuming your modernized ServiceConfiguration exports ConfigError
        credentialRequestCompleteCallback(new Error("Service not configured"));
      }
      return;
    }

    const credentialToken = Random.secret();

    // we need the email scope to get user id from google.
    const requiredScopes: Record<string, boolean> = { email: true };
    const requestPermissions = opts.requestPermissions || ['profile'];

    requestPermissions.forEach(scope => {
      requiredScopes[scope] = true;
    });

    const scopes = Object.keys(requiredScopes);

    const loginUrlParameters: Record<string, string> = {};

    if (config.loginUrlParameters) {
      Object.assign(loginUrlParameters, config.loginUrlParameters);
    }
    if (opts.loginUrlParameters) {
      Object.assign(loginUrlParameters, opts.loginUrlParameters);
    }

    // validate options keys
    Object.keys(loginUrlParameters).forEach(key => {
      if (ILLEGAL_PARAMETERS[key]) {
        throw new Error(`Google.requestCredential: Invalid loginUrlParameter: ${key}`);
      }
    });

    // backwards compatible options
    if (opts.requestOfflineToken != null) {
      loginUrlParameters.access_type = opts.requestOfflineToken ? 'offline' : 'online';
    }

    if (opts.prompt != null) {
      loginUrlParameters.prompt = opts.prompt;
    } else if (opts.forceApprovalPrompt) {
      loginUrlParameters.prompt = 'consent';
    }

    if (opts.loginHint) {
      loginUrlParameters.login_hint = opts.loginHint;
    }

    const loginStyle = OAuth._loginStyle('google', config, opts);

    // https://developers.google.com/accounts/docs/OAuth2WebServer#formingtheurl
    Object.assign(loginUrlParameters, {
      response_type: 'code',
      client_id: config.clientId,
      scope: scopes.join(' '), // space delimited
      redirect_uri: OAuth._redirectUri('google', config),
      state: OAuth._stateParam(loginStyle, credentialToken, opts.redirectUrl),
    });

    const loginUrl =
      'https://accounts.google.com/o/oauth2/auth?' +
      Object.keys(loginUrlParameters)
        .map(
          param =>
            `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`
        )
        .join('&');

    OAuth.launchLogin({
      loginService: 'google',
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback,
      credentialToken,
      popupOptions: { height: 600 },
    });
  },
};
