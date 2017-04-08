/*globals OAuth*/
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

		if (!/^https?:\/\/.+/.test(this.authorizePath)) {
			this.authorizePath = this.serverURL + this.authorizePath;
		}
	}

	configureLogin() {
		const loginWithService = `loginWith${ s.capitalize(this.name) }`;

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

		const config = ServiceConfiguration.configurations.findOne({service: this.name});
		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
			}
			return;
		}

		const credentialToken = Random.secret();
		const loginStyle = OAuth._loginStyle(this.name, config, options);

		const loginUrl = `${ this.authorizePath
			}?client_id=${ config.clientId
			}&redirect_uri=${ OAuth._redirectUri(this.name, config)
			}&response_type=code` +
			`&state=${ OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl)
			}&scope=${ this.scope }`;

		OAuth.launchLogin({
			loginService: this.name,
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: {
				width: 900,
				height: 450
			}
		});
	}
}
