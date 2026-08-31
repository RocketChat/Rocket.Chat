import type { FacebookOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import {
	createOAuthTotpLoginMethod,
	credentialRequestCompleteHandler,
	launchLogin,
	redirectUri,
	stateParam,
	wrapRequestCredentialFn,
} from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import type { AbsoluteUrlOptions } from '../../lib/absoluteUrl';

type LoginWithFacebookOptions = LoginWithExternalServiceOptions & {
	absoluteUrlOptions?: AbsoluteUrlOptions;
	params?: Record<string, any>;
	auth_type?: string;
};

const requestCredential = wrapRequestCredentialFn<FacebookOAuthConfiguration, LoginWithFacebookOptions>(
	'facebook',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		const loginUrl = new URL('https://www.facebook.com/v17.0/dialog/oauth');
		loginUrl.searchParams.append('client_id', config.appId);
		loginUrl.searchParams.append('redirect_uri', redirectUri('facebook', config, options.params, options.absoluteUrlOptions));
		loginUrl.searchParams.append(
			'display',
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent) ? 'touch' : 'popup',
		);
		loginUrl.searchParams.append('scope', options.requestPermissions?.join(',') ?? 'email');
		loginUrl.searchParams.append('state', stateParam(loginStyle, credentialToken, options?.redirectUrl));
		if (options.auth_type) loginUrl.searchParams.append('auth_type', options.auth_type);

		launchLogin({
			loginService: 'facebook',
			loginStyle,
			loginUrl: loginUrl.toString(),
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);

const loginWithFacebook = (
	options: LoginWithFacebookOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback);
	requestCredential(options, credentialRequestCompleteCallback);
};

const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod<LoginWithFacebookOptions>({ requestCredential });

const loginWithFacebookForMeteor = (
	options: LoginWithFacebookOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	overrideLoginMethod(loginWithFacebook, [options], callback, loginWithFacebookAndTOTP);
};

Object.assign(Accounts._loginFuncs, { facebook: loginWithFacebookForMeteor });
Object.assign(Meteor, { loginWithFacebook: loginWithFacebookForMeteor });
