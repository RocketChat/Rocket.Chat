import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Facebook } from 'meteor/facebook-oauth';
import { Github } from 'meteor/github-oauth';
import { Twitter } from 'meteor/twitter-oauth';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';
import { Linkedin } from 'meteor/pauli:linkedin-oauth';
import { OAuth } from 'meteor/oauth';
import s from 'underscore.string';

import { Utils2fa } from './lib/2fa';
import { process2faReturn } from './callWithTwoFactorRequired';
import { CustomOAuth } from '../../custom-oauth';

let lastCredentialToken = null;
let lastCredentialSecret = null;

Accounts.oauth.tryLoginAfterPopupClosed = function(credentialToken, callback, totpCode, credentialSecret = null) {
	credentialSecret = credentialSecret || OAuth._retrieveCredentialSecret(credentialToken) || null;
	const methodArgument = {
		oauth: {
			credentialToken,
			credentialSecret,
		},
	};

	lastCredentialToken = credentialToken;
	lastCredentialSecret = credentialSecret;

	if (totpCode && typeof totpCode === 'string') {
		methodArgument.totp = {
			code: totpCode,
		};
	}

	Accounts.callLoginMethod({
		methodArguments: [methodArgument],
		userCallback: callback && function(err) {
			callback(Utils2fa.convertError(err));
		} });
};

Accounts.oauth.credentialRequestCompleteHandler = function(callback, totpCode) {
	return function(credentialTokenOrError) {
		if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
			callback && callback(credentialTokenOrError);
		} else {
			Accounts.oauth.tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
		}
	};
};

const createOAuthTotpLoginMethod = (credentialProvider) => (options, code, callback) => {
	// support a callback without options
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}

	if (lastCredentialToken && lastCredentialSecret) {
		Accounts.oauth.tryLoginAfterPopupClosed(lastCredentialToken, callback, code, lastCredentialSecret);
	} else {
		const provider = (credentialProvider && credentialProvider()) || this;
		const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
		provider.requestCredential(options, credentialRequestCompleteCallback);
	}

	lastCredentialToken = null;
	lastCredentialSecret = null;
};

const loginWithOAuthTokenAndTOTP = createOAuthTotpLoginMethod();

const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(() => Facebook);
const { loginWithFacebook } = Meteor;
Meteor.loginWithFacebook = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithFacebook, [options], cb, loginWithFacebookAndTOTP);
};

const loginWithGithubAndTOTP = createOAuthTotpLoginMethod(() => Github);
const { loginWithGithub } = Meteor;
Meteor.loginWithGithub = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithGithub, [options], cb, loginWithGithubAndTOTP);
};

const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod(() => MeteorDeveloperAccounts);
const { loginWithMeteorDeveloperAccount } = Meteor;
Meteor.loginWithMeteorDeveloperAccount = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], cb, loginWithMeteorDeveloperAccountAndTOTP);
};

const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(() => Twitter);
const { loginWithTwitter } = Meteor;
Meteor.loginWithTwitter = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithTwitter, [options], cb, loginWithTwitterAndTOTP);
};

const loginWithLinkedinAndTOTP = createOAuthTotpLoginMethod(() => Linkedin);
const { loginWithLinkedin } = Meteor;
Meteor.loginWithLinkedin = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithLinkedin, [options], cb, loginWithLinkedinAndTOTP);
};

Accounts.onPageLoadLogin((loginAttempt) => {
	if (loginAttempt?.error?.error !== 'totp-required') {
		return;
	}

	const { methodArguments } = loginAttempt;
	if (!methodArguments?.length) {
		return;
	}

	const oAuthArgs = methodArguments.find((arg) => arg.oauth);
	const { credentialToken, credentialSecret } = oAuthArgs.oauth;
	const cb = loginAttempt.userCallback;

	process2faReturn({
		error: loginAttempt.error,
		originalCallback: cb,
		onCode: (code) => {
			Accounts.oauth.tryLoginAfterPopupClosed(credentialToken, cb, code, credentialSecret);
		},
	});
});

const oldConfigureLogin = CustomOAuth.prototype.configureLogin;
CustomOAuth.prototype.configureLogin = function(...args) {
	const loginWithService = `loginWith${ s.capitalize(this.name) }`;

	oldConfigureLogin.apply(this, args);

	const oldMethod = Meteor[loginWithService];

	Meteor[loginWithService] = function(options, cb) {
		Utils2fa.overrideLoginMethod(oldMethod, [options], cb, loginWithOAuthTokenAndTOTP);
	};
};
