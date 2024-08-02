import type { LinkedinOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Linkedin } from 'meteor/pauli:linkedin-oauth';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';
import { createOAuthTotpLoginMethod } from './oauth';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLinkedin(options?: Meteor.LoginWithExternalServiceOptions, callback?: LoginCallback): void;
	}
}
const { loginWithLinkedin } = Meteor;
const loginWithLinkedinAndTOTP = createOAuthTotpLoginMethod(Linkedin);
Meteor.loginWithLinkedin = (options, callback) => {
	overrideLoginMethod(loginWithLinkedin, [options], callback, loginWithLinkedinAndTOTP);
};

Linkedin.requestCredential = wrapRequestCredentialFn<LinkedinOAuthConfiguration>(
	'linkedin',
	({ options, credentialRequestCompleteCallback, config, loginStyle }) => {
		const credentialToken = Random.secret();

		const { requestPermissions } = options;
		const scope = (requestPermissions || ['openid', 'email', 'profile']).join('+');

		const loginUrl = `https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=${
			config.clientId
		}&redirect_uri=${OAuth._redirectUri('linkedin', config)}&state=${OAuth._stateParam(loginStyle, credentialToken)}&scope=${scope}`;

		OAuth.launchLogin({
			credentialRequestCompleteCallback,
			credentialToken,
			loginService: 'linkedin',
			loginStyle,
			loginUrl,
			popupOptions: {
				width: 390,
				height: 628,
			},
		});
	},
);
