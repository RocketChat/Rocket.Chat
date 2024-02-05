import { Meteor } from 'meteor/meteor';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';
import { OAuth } from 'meteor/oauth';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithMeteorDeveloperAccount } = Meteor;
const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod(MeteorDeveloperAccounts);
Meteor.loginWithMeteorDeveloperAccount = (options, callback) => {
	overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], callback, loginWithMeteorDeveloperAccountAndTOTP);
};

MeteorDeveloperAccounts.requestCredential = wrapRequestCredentialFn(
	'meteor-developer',
	({ config, loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const options = requestOptions as Record<string, any>;

		const credentialToken = Random.secret();

		let loginUrl =
			`${MeteorDeveloperAccounts._server}/oauth2/authorize?` +
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
