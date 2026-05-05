import type { FacebookOAuthConfiguration } from '@rocket.chat/core-typings';
import { oauth } from '@rocket.chat/ddp-client';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { createOAuthTotpLoginMethod } from './oauth';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { redirectUri } from '../../lib/oauth/redirectUri';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

const requestCredential = wrapRequestCredentialFn<FacebookOAuthConfiguration>(
	'facebook',
	({ config, loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const options = requestOptions as Meteor.LoginWithExternalServiceOptions & {
			absoluteUrlOptions?: Record<string, any>;
			params?: Record<string, any>;
			auth_type?: string;
		};

		const credentialToken = Random.secret();
		const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
		const display = mobile ? 'touch' : 'popup';

		const scope = options?.requestPermissions ? options.requestPermissions.join(',') : 'email';

		const API_VERSION = Meteor.settings?.public?.packages?.['facebook-oauth']?.apiVersion || '17.0';

		const loginUrlParameters: Record<string, any> = {
			client_id: config.appId,
			redirect_uri: redirectUri('facebook', config, options.params, options.absoluteUrlOptions),
			display,
			scope,
			state: oauth.stateParam(loginStyle, credentialToken, options?.redirectUrl, {
				isCordova: !!Meteor.isCordova,
			}),
			// Handle authentication type (e.g. for force login you need auth_type: "reauthenticate")
			...(options.auth_type && { auth_type: options.auth_type }),
		};

		const loginUrl = `https://www.facebook.com/v${API_VERSION}/dialog/oauth?${Object.keys(loginUrlParameters)
			.map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`)
			.join('&')}`;

		oauth.launchLogin({
			loginService: 'facebook',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
);

const Facebook: IOAuthProvider = {
	name: 'facebook',
	requestCredential,
};

const { loginWithFacebook } = Meteor;
const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(Facebook);
Meteor.loginWithFacebook = (options, callback) => {
	overrideLoginMethod(loginWithFacebook, [options], callback, loginWithFacebookAndTOTP);
};
