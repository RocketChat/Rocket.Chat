/* globals createOAuthTotpLoginMethod, overrideLoginMethod*/

Accounts.oauth.tryLoginAfterPopupClosed = function(credentialToken, callback, totpCode) {
  const credentialSecret = OAuth._retrieveCredentialSecret(credentialToken) || null;

  let methodArgument = {oauth: {
    credentialToken,
    credentialSecret
  }};

  if (totpCode && typeof totpCode == "string") {
    methodArgument.totp = {
      code : totpCode
    };
  }

  Accounts.callLoginMethod({
    methodArguments: [methodArgument],
    userCallback: callback && function (err) {
      callback(convertError(err));
    }});
};

Accounts.oauth.credentialRequestCompleteHandler = function(callback, totpCode) {
  return function (credentialTokenOrError) {
    if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
      callback && callback(credentialTokenOrError);
    } else {
      Accounts.oauth.tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
    }
  };
};

const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(() => { return Facebook; });
const loginWithFacebook = Meteor.loginWithFacebook;
Meteor.loginWithFacebook = function(options, cb) {
  overrideLoginMethod(loginWithFacebook, [options], cb, loginWithFacebookAndTOTP);
};

const loginWithGithubAndTOTP = createOAuthTotpLoginMethod(() => { return Github; });
const loginWithGithub = Meteor.loginWithGithub;
Meteor.loginWithGithub = function(options, cb) {
  overrideLoginMethod(loginWithGithub, [options], cb, loginWithGithubAndTOTP);
};

const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod(() => { return MeteorDeveloperAccounts; });
const loginWithMeteorDeveloperAccount = Meteor.loginWithMeteorDeveloperAccount;
Meteor.loginWithMeteorDeveloperAccount = function(options, cb) {
  overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], cb, loginWithMeteorDeveloperAccountAndTOTP);
};

const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(() => { return Twitter; });
const loginWithTwitter = Meteor.loginWithTwitter;
Meteor.loginWithTwitter = function(options, cb) {
  overrideLoginMethod(loginWithTwitter, [options], cb, loginWithTwitterAndTOTP);
};