import { capitalize } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { OAuth } from 'meteor/oauth';

import './swapSessionStorage';
import { isURL } from '../../utils/lib/isURL';

// Request custom OAuth credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.

export class CustomOAuth {
	constructor(name, options) {
		this.name = name;
		if (!Match.test(this.name, String)) {
			throw new Meteor.Error('CustomOAuth: Name is required and must be String');
		}

		this.configure(options);

		Accounts.oauth.registerService(this.name);

		this.configureLogin();
	}

	configure(options) {
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
		const loginWithService = `loginWith${capitalize(String(this.name || ''))}`;

		Meteor[loginWithService] = (options, callback) => {
			// support a callback without options
			if (!callback && typeof options === 'function') {
				callback = options;
				options = null;
			}

			const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
			this.requestCredential(options, credentialRequestCompleteCallback);
		};
	}

	requestCredential(options, credentialRequestCompleteCallback) {
		// support both (options, callback) and (callback).
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			credentialRequestCompleteCallback = options;
			options = {};
		}

		const config = ServiceConfiguration.configurations.findOne({ service: this.name });
		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
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
