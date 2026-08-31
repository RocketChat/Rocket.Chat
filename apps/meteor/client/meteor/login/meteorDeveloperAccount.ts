import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

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

type LoginWithMeteorDeveloperAccountOptions = LoginWithExternalServiceOptions & {
	details?: string;
};

const requestCredential = wrapRequestCredentialFn<Partial<OAuthConfiguration>, LoginWithMeteorDeveloperAccountOptions>(
	'meteor-developer',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		const loginUrl = new URL('https://www.meteor.com/oauth2/authorize');
		loginUrl.searchParams.append('state', stateParam(loginStyle, credentialToken, options.redirectUrl));
		loginUrl.searchParams.append('response_type', 'code');
		loginUrl.searchParams.append('client_id', config.clientId ?? '');
		if (options.details) loginUrl.searchParams.append('details', options.details);
		if (options.loginHint) loginUrl.searchParams.append('user_email', options.loginHint);
		loginUrl.searchParams.append('redirect_uri', redirectUri('meteor-developer', config));

		launchLogin({
			loginService: 'meteor-developer',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: { width: 497, height: 749 },
		});
	},
);

const loginWithMeteorDeveloperAccount = (
	options: LoginWithMeteorDeveloperAccountOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback);
	requestCredential(options, credentialRequestCompleteCallback);
};

const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod<LoginWithMeteorDeveloperAccountOptions>({ requestCredential });

const loginWithMeteorDeveloperAccountForMeteor = (
	options: LoginWithMeteorDeveloperAccountOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], callback, loginWithMeteorDeveloperAccountAndTOTP);
};

Object.assign(Accounts._loginFuncs, { 'meteor-developer': loginWithMeteorDeveloperAccountForMeteor });
Object.assign(Meteor, { loginWithMeteorDeveloperAccount: loginWithMeteorDeveloperAccountForMeteor });
