import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Twitter } from 'meteor/twitter-oauth';

import { createOAuthTotpLoginMethod, credentialRequestCompleteHandler } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { absoluteUrl } from '../../lib/absoluteUrl';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithTwitterOptions = LoginWithExternalServiceOptions & {
	force_login?: string;
	screen_name?: string;
};

const validParamsAuthenticate = ['force_login', 'screen_name'] as const;

const requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration, LoginWithTwitterOptions>(
	'twitter',
	({ loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${OAuth._stateParam(
			loginStyle,
			credentialToken,
			options?.redirectUrl,
		)}`;

		// Support additional, permitted parameters
		if (options) {
			validParamsAuthenticate.forEach((param) => {
				if (Object.hasOwn(options, param) && options[param] !== undefined) {
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

const loginWithTwitter = (
	options: LoginWithTwitterOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback);
	requestCredential(options, credentialRequestCompleteCallback);
};

const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod<LoginWithTwitterOptions>({ requestCredential });

const loginWithTwitterForMeteor = (
	options: LoginWithTwitterOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	overrideLoginMethod(loginWithTwitter, [options], callback, loginWithTwitterAndTOTP);
};

Object.assign(Twitter, { validParamsAuthenticate, requestCredential });
Object.assign(Accounts._loginFuncs, { twitter: loginWithTwitterForMeteor });
Object.assign(Meteor, { loginWithTwitter: loginWithTwitterForMeteor });
