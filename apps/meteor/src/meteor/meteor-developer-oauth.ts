import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MeteorDeveloperOptions = {
	developerAccountsServer?: string;
	redirectUrl?: string;
	details?: string;
	userEmail?: string;
	loginHint?: string;
	loginStyle?: 'popup' | 'redirect';
	[key: string]: any;
};

type CredentialRequestCompleteCallback = (error?: Error | unknown) => void;

// -----------------------------------------------------------------------------
// Meteor Developer Accounts Implementation
// -----------------------------------------------------------------------------

export const MeteorDeveloperAccounts = {
	_server: 'https://www.meteor.com',

	/**
	 * Sets the server configuration (e.g. for testing against a local server).
	 */
	_config(options: MeteorDeveloperOptions) {
		if (options.developerAccountsServer) {
			this._server = options.developerAccountsServer;
		}
	},

	/**
	 * Request credentials from Meteor Developer Accounts.
	 */
	requestCredential(
		options?: MeteorDeveloperOptions | CredentialRequestCompleteCallback,
		credentialRequestCompleteCallback?: CredentialRequestCompleteCallback,
	) {
		// Support (callback) signature without options
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			credentialRequestCompleteCallback = options;
			options = {};
		}

		const config = ServiceConfiguration.configurations.findOne({ service: 'meteor-developer' }) as MeteorDeveloperOptions | undefined;

		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
			}
			return;
		}

		const opts = (options as MeteorDeveloperOptions) || {};
		const credentialToken = Random.secret();
		const loginStyle = OAuth._loginStyle('meteor-developer', config, opts);

		// Handle login hint logic (userEmail is legacy alias for loginHint)
		let { loginHint } = opts;
		if (opts.userEmail && !loginHint) {
			loginHint = opts.userEmail;
		}

		// Construct Login URL
		let loginUrl =
			`${MeteorDeveloperAccounts._server}/oauth2/authorize` +
			`?state=${OAuth._stateParam(loginStyle, credentialToken, opts.redirectUrl)}` +
			`&response_type=code` +
			`&client_id=${config.clientId}`;

		if (opts.details) {
			loginUrl += `&details=${opts.details}`;
		}

		if (loginHint) {
			loginUrl += `&user_email=${encodeURIComponent(loginHint)}`;
		}

		loginUrl += `&redirect_uri=${OAuth._redirectUri('meteor-developer', config)}`;

		OAuth.launchLogin({
			loginService: 'meteor-developer',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: { width: 497, height: 749 },
		});
	},
};

// -----------------------------------------------------------------------------
// Legacy Registration
// -----------------------------------------------------------------------------

Package['meteor-developer-oauth'] = { MeteorDeveloperAccounts };
