import { OAuth } from './oauth.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';

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

export const MeteorDeveloperAccounts = {
	_server: 'https://www.meteor.com',

	_config(options: MeteorDeveloperOptions) {
		if (options.developerAccountsServer) {
			this._server = options.developerAccountsServer;
		}
	},

	requestCredential(
		options?: MeteorDeveloperOptions | CredentialRequestCompleteCallback,
		credentialRequestCompleteCallback?: CredentialRequestCompleteCallback,
	) {
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
		let { loginHint } = opts;
		if (opts.userEmail && !loginHint) {
			loginHint = opts.userEmail;
		}
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
