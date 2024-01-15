import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Twitter } from 'meteor/twitter-oauth';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithTwitter } = Meteor;
const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(Twitter);
Meteor.loginWithTwitter = (options, callback) => {
	overrideLoginMethod(loginWithTwitter, [options], callback, loginWithTwitterAndTOTP);
};

Twitter.requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration>(
	'twitter',
	({ loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const options = requestOptions as Record<string, string>;
		const credentialToken = Random.secret();

		let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${OAuth._stateParam(
			loginStyle,
			credentialToken,
			options?.redirectUrl,
		)}`;

		if (Meteor.isCordova) {
			loginPath += '&cordova=true';
			if (/Android/i.test(navigator.userAgent)) {
				loginPath += '&android=true';
			}
		}

		// Support additional, permitted parameters
		if (options) {
			const hasOwn = Object.prototype.hasOwnProperty;
			Twitter.validParamsAuthenticate.forEach((param: string) => {
				if (hasOwn.call(options, param)) {
					loginPath += `&${param}=${encodeURIComponent(options[param])}`;
				}
			});
		}

		const loginUrl = Meteor.absoluteUrl(loginPath);

		OAuth.launchLogin({
			loginService: 'twitter',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);
