import { Random } from 'meteor/random';
import { OAuth } from 'meteor/oauth';

// Combined Common & Client State
export const MeteorDeveloperAccounts = {
  server: 'https://www.meteor.com',
  config(options: { developerAccountsServer?: string }): void {
    if (options.developerAccountsServer) {
      this.server = options.developerAccountsServer;
    }
  }
};

export type MeteorDeveloperConfig = {
  clientId?: string;
  secret?: string; // Secret isn't strictly needed on the client, but keeping it for type alignment
  loginStyle?: OAuth.LoginStyle;
};

export type CredentialRequestOptions = {
  redirectUrl?: string;
  details?: string;
  loginHint?: string;
  loginStyle?: OAuth.LoginStyle;
  /** @deprecated Use loginHint instead */
  userEmail?: string; 
};

export type CredentialRequestCallback = (credentialTokenOrError?: string | Error) => void;

/**
 * Request Meteor developer account credentials for the user
 * * @param config - The OAuth configuration object (clientId, etc.)
 * @param options - Configuration options for the login request.
 * @param credentialRequestCompleteCallback - Callback function to call on completion. 
 */
export const requestCredential = (
  config: MeteorDeveloperConfig,
  options?: CredentialRequestOptions | CredentialRequestCallback,
  credentialRequestCompleteCallback?: CredentialRequestCallback
): void => {
  if (!config || !config.clientId) {
    const error = new Error('Service meteor-developer is missing clientId in configuration');
    if (typeof options === 'function') options(error);
    else if (credentialRequestCompleteCallback) credentialRequestCompleteCallback(error);
    else throw error;
    return;
  }

  // Support an overloaded signature: a callback without options
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options as CredentialRequestCallback;
    options = undefined;
  }

  const opts = options as CredentialRequestOptions | undefined;
  const credentialToken = Random.secret();
  const loginStyle = OAuth._loginStyle('meteor-developer', config, opts);

  let loginUrl = `${MeteorDeveloperAccounts.server}/oauth2/authorize?` +
    `state=${OAuth._stateParam(loginStyle, credentialToken, opts?.redirectUrl)}` +
    `&response_type=code` +
    `&client_id=${config.clientId}${opts?.details ? `&details=${opts.details}` : ''}`;

  // Handle deprecated userEmail fallback
  if (opts?.userEmail && !opts?.loginHint) {
    opts.loginHint = opts.userEmail;
  }

  if (opts?.loginHint) {
    loginUrl += `&user_email=${encodeURIComponent(opts.loginHint)}`;
  }

  loginUrl += `&redirect_uri=${OAuth._redirectUri('meteor-developer', config)}`;

  OAuth.launchLogin({
    loginService: 'meteor-developer',
    loginStyle,
    loginUrl,
    credentialRequestCompleteCallback,
    credentialToken,
    popupOptions: { width: 497, height: 749 }
  });
};