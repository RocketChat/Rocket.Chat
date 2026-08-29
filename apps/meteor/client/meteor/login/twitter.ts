import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Twitter } from 'meteor/twitter-oauth';

import { createOAuthTotpLoginMethod } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { absoluteUrl } from '../../lib/absoluteUrl';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithTwitterOptions = LoginWithExternalServiceOptions & {
	[param: string]: string;
};

const { loginWithTwitter } = Meteor;
const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(Twitter);
Meteor.loginWithTwitter = (options, callback) => {
	overrideLoginMethod(loginWithTwitter, [options], callback, loginWithTwitterAndTOTP);
};

Twitter.requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration, LoginWithTwitterOptions>(
	'twitter',
	({ loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const options = requestOptions;
		const credentialToken = Random.secret();

		let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${OAuth._stateParam(
			loginStyle,
			credentialToken,
			options?.redirectUrl,
		)}`;

		// Support additional, permitted parameters
		if (options) {
			const hasOwn = Object.prototype.hasOwnProperty;
			Twitter.validParamsAuthenticate.forEach((param: string) => {
				if (hasOwn.call(options, param)) {
					loginPath += `&${param}=${encodeURIComponent(options[param])}`;
				}
			});
		}

		const loginUrl = absoluteUrl(loginPath);

		OAuth.launchLogin({
			loginService: 'twitter',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);
