import type { OauthConfig } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { capitalize } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

import type { IOAuthProvider } from '../../../client/definitions/IOAuthProvider';
import { overrideLoginMethod, type LoginCallback } from '../../../client/lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from '../../../client/meteorOverrides/login/oauth';
import { isURL } from '../../../lib/utils/isURL';

// Request custom OAuth credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.

export class CustomOAuth implements IOAuthProvider {
	public serverURL: string;

	public authorizePath: string;

	public scope: string;

	public responseType: string;

	constructor(public readonly name: string, options: OauthConfig) {
		this.name = name;
		if (!Match.test(this.name, String)) {
			throw new Meteor.Error('CustomOAuth: Name is required and must be String');
		}

		this.configure(options);

		Accounts.oauth.registerService(this.name);

		this.configureLogin();
	}

	configure(options: OauthConfig) {
		if (!Match.test(options, Object)) {
			throw new Meteor.Error('CustomOAuth: Options is required and must be Object');
		}

		if (!Match.test(options.serverURL, String)) {
			throw new Meteor.Error('CustomOAuth: Options.serverURL is required and must be String');
		}

		if (!Match.test(options.authorizePath, String)) {
			options.authorizePath = '/oauth/authorize';
		}

		if (!Match.test(options.scope, String)) {
			options.scope = 'openid';
		}

		this.serverURL = options.serverURL;
		this.authorizePath = options.authorizePath;
		this.scope = options.scope;
		this.responseType = options.responseType || 'code';

		if (!isURL(this.authorizePath)) {
			this.authorizePath = this.serverURL + this.authorizePath;
		}
	}

	configureLogin() {
		const loginWithService = `loginWith${capitalize(String(this.name || ''))}` as const;

		const loginWithOAuthTokenAndTOTP = createOAuthTotpLoginMethod(this);

		const loginWithOAuthToken = async (options?: Meteor.LoginWithExternalServiceOptions, callback?: LoginCallback) => {
			const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
			await this.requestCredential(options, credentialRequestCompleteCallback);
		};

		(Meteor as any)[loginWithService] = (options: Meteor.LoginWithExternalServiceOptions, callback: LoginCallback) => {
			overrideLoginMethod(loginWithOAuthToken, [options], callback, loginWithOAuthTokenAndTOTP);
		};
	}

	async requestCredential(
		options: Meteor.LoginWithExternalServiceOptions = {},
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	) {
		const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });
		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new Accounts.ConfigError());
			}
			return;
		}

		const credentialToken = Random.secret();
		const loginStyle = OAuth._loginStyle(this.name, config, options);

		const separator = this.authorizePath.indexOf('?') !== -1 ? '&' : '?';

		const loginUrl =
			`${this.authorizePath}${separator}client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
				OAuth._redirectUri(this.name, config),
			)}&response_type=${encodeURIComponent(this.responseType)}` +
			`&state=${encodeURIComponent(OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl))}&scope=${encodeURIComponent(
				this.scope,
			)}`;

		OAuth.launchLogin({
			loginService: this.name,
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: {
				width: 900,
				height: 450,
			},
		});
	}
}
