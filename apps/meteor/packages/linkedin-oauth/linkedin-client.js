import { ServiceConfiguration } from 'meteor/service-configuration';
import { Random } from 'meteor/random';
import { OAuth } from 'meteor/oauth';

export const Linkedin = {};

// Request LinkedIn credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Linkedin.requestCredential = function (options, credentialRequestCompleteCallback) {
	// support both (options, callback) and (callback).
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	}

	const config = ServiceConfiguration.configurations.findOne({ service: 'linkedin' });
	if (!config) {
		credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError('Service not configured'));
		return;
	}

	const credentialToken = Random.secret();

	let scope;
	const { requestPermissions, ...otherOptionsToPassThrough } = options;
	if (requestPermissions) {
		scope = requestPermissions.join('+');
	} else {
		// If extra permissions not passed, we need to request basic, available to all
		scope = 'r_emailaddress+r_liteprofile';
	}
	const loginStyle = OAuth._loginStyle('linkedin', config, options);
	if (!otherOptionsToPassThrough.popupOptions) {
		// the default dimensions (https://github.com/meteor/meteor/blob/release-1.6.1/packages/oauth/oauth_browser.js#L15) don't play well with the content shown by linkedin
		// so override popup dimensions to something appropriate (might have to change if LinkedIn login page changes its layout)
		otherOptionsToPassThrough.popupOptions = {
			width: 390,
			height: 628,
		};
	}

	const loginUrl = `https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=${
		config.clientId
	}&redirect_uri=${OAuth._redirectUri('linkedin', config)}&state=${OAuth._stateParam(loginStyle, credentialToken)}&scope=${scope}`;

	OAuth.launchLogin({
		credentialRequestCompleteCallback,
		credentialToken,
		loginService: 'linkedin',
		loginStyle,
		loginUrl,
		...otherOptionsToPassThrough,
	});
};
