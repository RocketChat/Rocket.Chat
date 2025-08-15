import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { createOAuthLoginFn } from './createOAuthLoginFn';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

Meteor.loginWithGithub = createOAuthLoginFn({
	name: 'github',

	requestCredential: wrapRequestCredentialFn('github', ({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();
		const scope = options?.requestPermissions || ['user:email'];
		const flatScope = scope.map(encodeURIComponent).join('+');

		let allowSignup = '';
		if (Accounts._options?.forbidClientAccountCreation) {
			allowSignup = '&allow_signup=false';
		}

		const loginUrl =
			`https://github.com/login/oauth/authorize` +
			`?client_id=${config.clientId}` +
			`&scope=${flatScope}` +
			`&redirect_uri=${OAuth._redirectUri('github', config)}` +
			`&state=${OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl)}${allowSignup}`;

		OAuth.launchLogin({
			loginService: 'github',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: { width: 900, height: 450 },
		});
	}),
});
