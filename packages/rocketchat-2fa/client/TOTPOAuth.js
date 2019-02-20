import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Utils2fa } from './lib/2fa';

import { Facebook } from 'meteor/facebook-oauth';
import { Github } from 'meteor/github-oauth';
import { Twitter } from 'meteor/twitter-oauth';
import { LinkedIn } from 'meteor/linkedin-oauth';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';
import { OAuth } from 'meteor/oauth';

Accounts.oauth.tryLoginAfterPopupClosed = function(credentialToken, callback, totpCode) {
	const credentialSecret = OAuth._retrieveCredentialSecret(credentialToken) || null;
	const methodArgument = {
		oauth: {
			credentialToken,
			credentialSecret,
		},
	};

	if (totpCode && typeof totpCode === 'string') {
		methodArgument.totp = {
			code : totpCode,
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

const loginWithFacebookAndTOTP = Utils2fa.createOAuthTotpLoginMethod(() => Facebook);
const { loginWithFacebook } = Meteor;
Meteor.loginWithFacebook = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithFacebook, [options], cb, loginWithFacebookAndTOTP);
};

const loginWithGithubAndTOTP = Utils2fa.createOAuthTotpLoginMethod(() => Github);
const { loginWithGithub } = Meteor;
Meteor.loginWithGithub = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithGithub, [options], cb, loginWithGithubAndTOTP);
};

const loginWithMeteorDeveloperAccountAndTOTP = Utils2fa.createOAuthTotpLoginMethod(() => MeteorDeveloperAccounts);
const { loginWithMeteorDeveloperAccount } = Meteor;
Meteor.loginWithMeteorDeveloperAccount = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], cb, loginWithMeteorDeveloperAccountAndTOTP);
};

const loginWithTwitterAndTOTP = Utils2fa.createOAuthTotpLoginMethod(() => Twitter);
const { loginWithTwitter } = Meteor;
Meteor.loginWithTwitter = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithTwitter, [options], cb, loginWithTwitterAndTOTP);
};

const loginWithLinkedinAndTOTP = Utils2fa.createOAuthTotpLoginMethod(() => LinkedIn);
const { loginWithLinkedin } = Meteor;
Meteor.loginWithLinkedin = function(options, cb) {
	Utils2fa.overrideLoginMethod(loginWithLinkedin, [options], cb, loginWithLinkedinAndTOTP);
};
