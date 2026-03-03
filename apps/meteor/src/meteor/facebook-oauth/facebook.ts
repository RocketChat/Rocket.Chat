import { ServiceConfiguration } from 'meteor/service-configuration';
import { Random } from 'meteor/random';
import { OAuth } from 'meteor/oauth';
import { Meteor } from 'meteor/meteor';

export type FacebookRequestCredentialOptions = {
  requestPermissions?: string[];
  redirectUrl?: string;
  auth_type?: string;
  params?: Record<string, any>;
  absoluteUrlOptions?: Record<string, any>;
}

export type CredentialRequestCompleteCallback = (tokenOrError: string | Error) => void;

export const Facebook = {
  /**
   * Request Facebook credentials for the user
   *
   * @param options {optional}
   * @param credentialRequestCompleteCallback {Function} Callback function to call on completion.
   */
  requestCredential(
    options?: FacebookRequestCredentialOptions | CredentialRequestCompleteCallback | undefined,
    credentialRequestCompleteCallback?: CredentialRequestCompleteCallback | undefined
  ): void {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
      credentialRequestCompleteCallback = options as CredentialRequestCompleteCallback;
      options = {};
    }

    const opts = (options || {}) as FacebookRequestCredentialOptions;

    const config = ServiceConfiguration.configurations.findOne({ service: 'facebook' });
    if (!config) {
      if (credentialRequestCompleteCallback) {
        // Assuming your modernized ServiceConfiguration exports this error, or using a standard Error
        credentialRequestCompleteCallback(new Error("Service not configured")); 
      }
      return;
    }

    const credentialToken = Random.secret();
    
    // Determine display mode based on User-Agent
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
    const display = mobile ? 'touch' : 'popup';

    let scope = "email";
    if (opts.requestPermissions) {
      scope = opts.requestPermissions.join(',');
    }

    const loginStyle = OAuth._loginStyle('facebook', config, opts);

    // Read API version from settings, default to 17.0
    // Cast to any to safely navigate potentially missing deeply nested settings
    const apiVersion = (Meteor.settings as any)?.public?.packages?.['facebook-oauth']?.apiVersion || '17.0';

    const redirectUri = OAuth._redirectUri('facebook', config, opts.params, opts.absoluteUrlOptions);
    const state = OAuth._stateParam(loginStyle, credentialToken, opts.redirectUrl);

    let loginUrl =
      `https://www.facebook.com/v${apiVersion}/dialog/oauth?client_id=${config.appId}` +
      `&redirect_uri=${redirectUri}` +
      `&display=${display}&scope=${scope}` +
      `&state=${state}`;

    // Handle authentication type (e.g. for force login you need auth_type: "reauthenticate")
    if (opts.auth_type) {
      loginUrl += `&auth_type=${encodeURIComponent(opts.auth_type)}`;
    }

    OAuth.launchLogin({
      loginService: "facebook",
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback,
      credentialToken,
    });
  }
};