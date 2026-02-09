import { Meteor } from './meteor.ts';
import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';
import { hasOwn } from './utils/hasOwn.ts';
import { isObject } from './utils/isObject.ts';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type FacebookOptions = {
	requestPermissions?: string[];
	params?: any;
	absoluteUrlOptions?: any;
	redirectUrl?: string;
	auth_type?: string;
	loginStyle?: string;
};

type CredentialRequestCompleteCallback = (error?: Error) => void;

// -----------------------------------------------------------------------------
// Facebook OAuth Implementation
// -----------------------------------------------------------------------------

export const Facebook = {
	requestCredential(
		options?: FacebookOptions | CredentialRequestCompleteCallback,
		credentialRequestCompleteCallback?: CredentialRequestCompleteCallback,
	) {
		// Support (callback) without options
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			credentialRequestCompleteCallback = options;
			options = {};
		}

		const config = ServiceConfiguration.configurations.findOne({ service: 'facebook' });

		if (!config || !isObject(config) || !hasOwn(config, 'appId')) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
			}
			return;
		}

		const opts = (options as FacebookOptions) || {};
		const credentialToken = Random.secret();
		const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
		const display = mobile ? 'touch' : 'popup';
		const scope = opts.requestPermissions ? opts.requestPermissions.join(',') : 'email';

		const loginStyle = OAuth._loginStyle('facebook', config, opts);

		// Access nested settings safely
		const API_VERSION = Meteor.settings?.public?.packages?.['facebook-oauth']?.apiVersion || '17.0';

		const redirectUri = OAuth._redirectUri('facebook', config, opts.params, opts.absoluteUrlOptions);
		const stateParam = OAuth._stateParam(loginStyle, credentialToken, opts.redirectUrl);

		let loginUrl = `https://www.facebook.com/v${API_VERSION}/dialog/oauth?client_id=${config.appId}&redirect_uri=${redirectUri}&display=${display}&scope=${scope}&state=${stateParam}`;

		if (opts.auth_type) {
			loginUrl += `&auth_type=${encodeURIComponent(opts.auth_type)}`;
		}

		OAuth.launchLogin({
			loginService: 'facebook',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
		});
	},
};

// -----------------------------------------------------------------------------
// Legacy Registration
// -----------------------------------------------------------------------------

Package['facebook-oauth'] = { Facebook };
