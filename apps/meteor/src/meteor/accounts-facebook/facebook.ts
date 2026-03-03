// Assumed imports from your demeteorized Accounts and Facebook OAuth core
import { Accounts } from 'meteor/accounts-base';
import { Facebook } from 'meteor/facebook-oauth';

// Register the service with the OAuth core
Accounts.oauth.registerService('facebook');

export interface LoginWithFacebookOptions {
  requestPermissions?: string[];
  requestOfflineToken?: boolean;
  forceApprovalPrompt?: boolean;
  redirectUrl?: string;
  loginHint?: string;
  loginStyle?: string;
}

export type LoginCallback = (error?: Error | any) => void;

/**
 * Initiates the Facebook OAuth login process.
 */
export const loginWithFacebook = (
  options?: LoginWithFacebookOptions | LoginCallback,
  callback?: LoginCallback
): void => {
  // Support a callback without options
  if (!callback && typeof options === "function") {
    callback = options;
    options = undefined;
  }

  const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
  
  Facebook.requestCredential(
    options, 
    credentialRequestCompleteCallback
  );
};

Accounts.registerClientLoginFunction('facebook', loginWithFacebook);

// Optional: Attach to a global Meteor object if you still have legacy code relying on `Meteor.loginWithFacebook`
const _global = globalThis as Record<string, any>;
if (_global.Meteor) {
  _global.Meteor.loginWithFacebook = (...args: any[]) => {
    return Accounts.applyLoginFunction('facebook', args);
  };
}