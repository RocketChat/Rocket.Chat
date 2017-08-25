/*globals Tokenly, OAuth */

'use strict';

Tokenly = {};

// Request Tokenly credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Tokenly.requestCredential = function(options, credentialRequestCompleteCallback) {
	// support both (options, callback) and (callback).
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	}

	const config = ServiceConfiguration.configurations.findOne({service: 'tokenly'});
	if (!config) {
		credentialRequestCompleteCallback && credentialRequestCompleteCallback(
			new ServiceConfiguration.ConfigError());
		return;
	}
	const credentialToken = Random.secret();

	const scope = (options && options.requestPermissions) || ['user', 'tca'];
	const flatScope = _.map(scope, encodeURIComponent).join('+');

	const loginStyle = OAuth._loginStyle('tokenly', config, options);

	const loginUrl = `${ 'https://tokenpass.tokenly.com/oauth/authorize?client_id=' }${ config.clientId }&scope=${ flatScope }&redirect_uri=${ OAuth._redirectUri('tokenly', config) }&state=${ OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl) }`;

	OAuth.launchLogin({
		loginService: 'tokenly',
		loginStyle,
		loginUrl,
		credentialRequestCompleteCallback,
		credentialToken
	});
};
