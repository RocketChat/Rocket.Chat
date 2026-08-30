import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';
import { OAuth } from 'meteor/oauth';
import { Random } from 'meteor/random';

import { createOAuthTotpLoginMethod, credentialRequestCompleteHandler } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithMeteorDeveloperAccountOptions = LoginWithExternalServiceOptions & {
	details?: string;
};

const requestCredential = wrapRequestCredentialFn<Partial<OAuthConfiguration>, LoginWithMeteorDeveloperAccountOptions>(
	'meteor-developer',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		let loginUrl =
			`https://www.meteor.com/oauth2/authorize?` +
			`state=${OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl)}` +
			`&response_type=code&` +
			`client_id=${config.clientId}${options.details ? `&details=${options.details}` : ''}`;

		if (options.loginHint) {
			loginUrl += `&user_email=${encodeURIComponent(options.loginHint)}`;
		}

		loginUrl += `&redirect_uri=${OAuth._redirectUri('meteor-developer', config)}`;

		OAuth.launchLogin({
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

Object.assign(MeteorDeveloperAccounts, { requestCredential });
Object.assign(Accounts._loginFuncs, { 'meteor-developer': loginWithMeteorDeveloperAccountForMeteor });
Object.assign(Meteor, { loginWithMeteorDeveloperAccount: loginWithMeteorDeveloperAccountForMeteor });
