import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Twitter } from 'meteor/twitter-oauth';

import { createOAuthTotpLoginMethod, credentialRequestCompleteHandler, launchLogin, wrapRequestCredentialFn } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { absoluteUrl } from '../../lib/absoluteUrl';

type LoginWithTwitterOptions = LoginWithExternalServiceOptions & {
	force_login?: string;
	screen_name?: string;
};

const validParamsAuthenticate = ['force_login', 'screen_name'] as const;

const requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration, LoginWithTwitterOptions>(
	'twitter',
	({ loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		const loginUrl = new URL(absoluteUrl('_oauth/twitter/'));
		loginUrl.searchParams.append('requestTokenAndRedirect', 'true');
		loginUrl.searchParams.append('state', OAuth._stateParam(loginStyle, credentialToken, options?.redirectUrl));
		// Support additional, permitted parameters
		if (options) {
			validParamsAuthenticate.forEach((param) => {
				if (Object.hasOwn(options, param) && options[param] !== undefined) {
					loginUrl.searchParams.append(param, options[param]);
				}
			});
		}

		launchLogin({
			loginService: 'twitter',
			loginStyle,
			loginUrl: loginUrl.toString(),
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
