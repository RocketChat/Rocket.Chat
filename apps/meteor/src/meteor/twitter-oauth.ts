import { Meteor } from './meteor.ts';
import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';
import { hasOwn } from './utils/hasOwn.ts';

export const validParamsAuthenticate = ['force_login', 'screen_name'];

export const requestCredential = (
	options: { [x: string]: string | number | boolean; redirectUrl?: any },
	credentialRequestCompleteCallback?: (error?: Error) => void,
): void => {
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	}

	const config = ServiceConfiguration.configurations.findOne({ service: 'twitter' });

	if (!config) {
		credentialRequestCompleteCallback?.(new ServiceConfiguration.ConfigError());

		return;
	}

	const credentialToken = Random.secret();
	const loginStyle = OAuth._loginStyle('twitter', config, options);
	let loginPath = `_oauth/twitter/?requestTokenAndRedirect=true&state=${OAuth._stateParam(loginStyle, credentialToken, options?.redirectUrl)}`;

	if (options) {
		validParamsAuthenticate.forEach((param) => {
			if (hasOwn(options, param)) {
				loginPath += `&${param}=${encodeURIComponent(options[param])}`;
			}
		});
	}

	const loginUrl = Meteor.absoluteUrl(loginPath);

	OAuth.launchLogin({
		loginService: 'twitter',
		loginStyle,
		loginUrl,
		credentialRequestCompleteCallback,
		credentialToken,
	});
};

export const Twitter = {
	validParamsAuthenticate,
	requestCredential,
};

Package['twitter-oauth'] = {
	Twitter,
};
