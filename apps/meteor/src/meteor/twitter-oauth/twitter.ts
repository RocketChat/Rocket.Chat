import { ServiceConfiguration } from 'meteor/service-configuration';
import { Random } from 'meteor/random';
import { OAuth } from 'meteor/oauth';
import { Meteor } from 'meteor/meteor';

export interface TwitterRequestCredentialOptions {
  requestPermissions?: string[];
  redirectUrl?: string;
  force_login?: boolean | string;
  screen_name?: string;
  [key: string]: any;
}

export type CredentialRequestCompleteCallback = (tokenOrError?: string | Error) => void;

export const Twitter = {
  // Common valid params for Twitter authentication
  validParamsAuthenticate: ['force_login', 'screen_name'],

  /**
   * Request Twitter credentials for the user
   *
   * @param options {optional}
   * @param credentialRequestCompleteCallback {Function} Callback function to call on completion.
   */
  requestCredential(
    options?: TwitterRequestCredentialOptions | CredentialRequestCompleteCallback,
    credentialRequestCompleteCallback?: CredentialRequestCompleteCallback
  ): void {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
      credentialRequestCompleteCallback = options as CredentialRequestCompleteCallback;
      options = {};
    }

    const opts = (options || {}) as TwitterRequestCredentialOptions;

    const config = ServiceConfiguration.configurations.findOne({ service: 'twitter' });
    if (!config) {
      if (credentialRequestCompleteCallback) {
        // Assumes your modernized ServiceConfiguration exports a ConfigError or standard Error
        credentialRequestCompleteCallback(new Error("Service not configured"));
      }
      return;
    }

    const credentialToken = Random.secret();
    // We need to keep credentialToken across the next two 'steps' so we're adding
    // a credentialToken parameter to the url and the callback url that we'll be returned
    // to by the oauth provider

    const loginStyle = OAuth._loginStyle('twitter', config, opts);

    // url to app, enters "step 1" as described in standard oauth1_server flow
    let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${OAuth._stateParam(
      loginStyle,
      credentialToken,
      opts.redirectUrl
    )}`;

    // Support additional, permitted parameters
    const hasOwn = Object.prototype.hasOwnProperty;
    Twitter.validParamsAuthenticate.forEach((param) => {
      if (hasOwn.call(opts, param)) {
        loginPath += `&${param}=${encodeURIComponent(String(opts[param]))}`;
      }
    });

    const loginUrl = Meteor.absoluteUrl(loginPath);

    OAuth.launchLogin({
      loginService: 'twitter',
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback,
      credentialToken,
    });
  },
};