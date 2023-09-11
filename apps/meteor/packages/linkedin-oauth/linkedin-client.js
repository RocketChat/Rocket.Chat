import { ServiceConfiguration } from 'meteor/service-configuration';
import { Random } from '@rocket.chat/random';
import { OAuth } from 'meteor/oauth';

export const Linkedin = {};

// Request LinkedIn credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Linkedin.requestCredential = async function (options, credentialRequestCompleteCallback) {
	// support both (options, callback) and (callback).
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	}

	const config = await ServiceConfiguration.configurations.findOneAsync({ service: 'linkedin' });
	if (!config) {
		throw new ServiceConfiguration.ConfigError('Service not configured');
	}

	const credentialToken = Random.secret();

	let scope;
	const { requestPermissions, ...otherOptionsToPassThrough } = options;
	if (requestPermissions) {
		scope = requestPermissions.join('+');
	} else {
		// If extra permissions not passed, we need to request basic, available to all
		scope = 'openid+email+profile';
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
