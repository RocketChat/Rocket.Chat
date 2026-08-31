import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { createOAuthLoginFunctionForMeteor, launchLogin, redirectUri, stateParam, wrapRequestCredentialFn } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';

type LoginWithMeteorDeveloperAccountOptions = LoginWithExternalServiceOptions & {
	details?: string;
};

const requestCredential = wrapRequestCredentialFn<Partial<OAuthConfiguration>, LoginWithMeteorDeveloperAccountOptions>(
	'meteor-developer',
	({ config, loginStyle, options, credentialRequestCompleteCallback, credentialToken }) => {
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

const loginWithMeteorDeveloperAccountForMeteor = createOAuthLoginFunctionForMeteor(requestCredential);

Object.assign(Accounts._loginFuncs, { 'meteor-developer': loginWithMeteorDeveloperAccountForMeteor });
Object.assign(Meteor, { loginWithMeteorDeveloperAccount: loginWithMeteorDeveloperAccountForMeteor });
