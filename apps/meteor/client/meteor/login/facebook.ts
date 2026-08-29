import type { FacebookOAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Facebook } from 'meteor/facebook-oauth';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { createOAuthTotpLoginMethod } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithFacebookOptions = LoginWithExternalServiceOptions & {
	absoluteUrlOptions?: Record<string, any>;
	params?: Record<string, any>;
	auth_type?: string;
};

const { loginWithFacebook } = Meteor;
const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(Facebook);
Meteor.loginWithFacebook = (options, callback) => {
	overrideLoginMethod(loginWithFacebook, [options], callback, loginWithFacebookAndTOTP);
};

Facebook.requestCredential = wrapRequestCredentialFn<FacebookOAuthConfiguration, LoginWithFacebookOptions>(
	'facebook',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();
		const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
		const display = mobile ? 'touch' : 'popup';

		const scope = options?.requestPermissions ? options.requestPermissions.join(',') : 'email';

		const loginUrlParameters: Record<string, any> = {
			client_id: config.appId,
			redirect_uri: OAuth._redirectUri('facebook', config, options.params, options.absoluteUrlOptions),
			display,
			scope,
			state: OAuth._stateParam(loginStyle, credentialToken, options?.redirectUrl),
			// Handle authentication type (e.g. for force login you need auth_type: "reauthenticate")
			...(options.auth_type && { auth_type: options.auth_type }),
		};

		const loginUrl = `https://www.facebook.com/v17.0/dialog/oauth?${Object.keys(loginUrlParameters)
			.map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`)
			.join('&')}`;

		OAuth.launchLogin({
			loginService: 'facebook',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);
