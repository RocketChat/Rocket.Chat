import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { oauth } from '@rocket.chat/ddp-client';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { createOAuthTotpLoginMethod } from './oauth';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { absoluteUrl } from '../../lib/absoluteUrl';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

// Mirrors `Twitter.validParamsAuthenticate` from meteor/twitter-oauth — the
// query params Twitter's /authenticate endpoint accepts beyond the OAuth core.
const TWITTER_VALID_PARAMS_AUTHENTICATE = ['force_login', 'screen_name'];

const requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration>(
	'twitter',
	({ loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const options = requestOptions as Record<string, string>;
		const credentialToken = Random.secret();

		let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${oauth.stateParam(
			loginStyle,
			credentialToken,
			options?.redirectUrl,
			{ isCordova: !!Meteor.isCordova },
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
			TWITTER_VALID_PARAMS_AUTHENTICATE.forEach((param) => {
				if (hasOwn.call(options, param)) {
					loginPath += `&${param}=${encodeURIComponent(options[param])}`;
				}
			});
		}

		const loginUrl = absoluteUrl(loginPath);

		oauth.launchLogin({
			loginService: 'twitter',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);

const Twitter: IOAuthProvider = {
	name: 'twitter',
	requestCredential,
};

const { loginWithTwitter } = Meteor;
const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(Twitter);
Meteor.loginWithTwitter = (options, callback) => {
	overrideLoginMethod(loginWithTwitter, [options], callback, loginWithTwitterAndTOTP);
};
