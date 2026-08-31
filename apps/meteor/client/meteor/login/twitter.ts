import type { TwitterOAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { createOAuthLoginFunctionForMeteor, launchLogin, stateParam, wrapRequestCredentialFn } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { absoluteUrl } from '../../lib/absoluteUrl';

type LoginWithTwitterOptions = LoginWithExternalServiceOptions & {
	force_login?: string;
	screen_name?: string;
};

const validParamsAuthenticate = ['force_login', 'screen_name'] as const;

const requestCredential = wrapRequestCredentialFn<TwitterOAuthConfiguration, LoginWithTwitterOptions>(
	'twitter',
	({ loginStyle, options, credentialRequestCompleteCallback, credentialToken }) => {
		const loginUrl = new URL(absoluteUrl('_oauth/twitter/'));
		loginUrl.searchParams.append('requestTokenAndRedirect', 'true');
		loginUrl.searchParams.append('state', stateParam(loginStyle, credentialToken, options?.redirectUrl));
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
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);

const loginWithTwitterForMeteor = createOAuthLoginFunctionForMeteor(requestCredential);

Object.assign(Accounts._loginFuncs, { twitter: loginWithTwitterForMeteor });
Object.assign(Meteor, { loginWithTwitter: loginWithTwitterForMeteor });
