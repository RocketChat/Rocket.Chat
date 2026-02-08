import { meteorInstall } from './modules.ts';
import { OAuth } from './oauth.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';
import { Package } from './package-registry.ts';

Package['core-runtime'].queue('google-oauth', () => {
	let Google;

	const require = meteorInstall(
		{
			node_modules: {
				meteor: {
					'google-oauth': {
						'google_client.js'(require, exports, module) {
							let Google;

							module.link(
								'./namespace.js',
								{
									default(v) {
										Google = v;
									},
								},
								0,
							);

							const hasOwn = Object.prototype.hasOwnProperty;

							const ILLEGAL_PARAMETERS = {
								response_type: 1,
								client_id: 1,
								scope: 1,
								redirect_uri: 1,
								state: 1,
							};

							Google.requestCredential = (options, credentialRequestCompleteCallback) => {
								if (!credentialRequestCompleteCallback && typeof options === 'function') {
									credentialRequestCompleteCallback = options;
									options = {};
								} else if (!options) {
									options = {};
								}

								const config = ServiceConfiguration.configurations.findOne({ service: 'google' });

								if (!config) {
									credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());

									return;
								}

								const credentialToken = Random.secret();
								const requiredScopes = { email: 1 };
								let scopes = options.requestPermissions || ['profile'];

								scopes.forEach((scope) => (requiredScopes[scope] = 1));
								scopes = Object.keys(requiredScopes);

								const loginUrlParameters = {};

								if (config.loginUrlParameters) {
									Object.assign(loginUrlParameters, config.loginUrlParameters);
								}

								if (options.loginUrlParameters) {
									Object.assign(loginUrlParameters, options.loginUrlParameters);
								}

								Object.keys(loginUrlParameters).forEach((key) => {
									if (hasOwn.call(ILLEGAL_PARAMETERS, key)) {
										throw new Error('Google.requestCredential: Invalid loginUrlParameter: '.concat(key));
									}
								});

								if (options.requestOfflineToken != null) {
									loginUrlParameters.access_type = options.requestOfflineToken ? 'offline' : 'online';
								}

								if (options.prompt != null) {
									loginUrlParameters.prompt = options.prompt;
								} else if (options.forceApprovalPrompt) {
									loginUrlParameters.prompt = 'consent';
								}

								if (options.loginHint) {
									loginUrlParameters.login_hint = options.loginHint;
								}

								const loginStyle = OAuth._loginStyle('google', config, options);

								Object.assign(loginUrlParameters, {
									response_type: 'code',
									client_id: config.clientId,
									scope: scopes.join(' '),
									redirect_uri: OAuth._redirectUri('google', config),
									state: OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl),
								});

								const loginUrl = `https://accounts.google.com/o/oauth2/auth?${Object.keys(loginUrlParameters)
									.map((param) => ''.concat(encodeURIComponent(param), '=').concat(encodeURIComponent(loginUrlParameters[param])))
									.join('&')}`;

								OAuth.launchLogin({
									loginService: 'google',
									loginStyle,
									loginUrl,
									credentialRequestCompleteCallback,
									credentialToken,
									popupOptions: { height: 600 },
								});
							};
						},

						'namespace.js'(require, exports, module) {
							!function (module1) {
								Google = module.exports;
								Google.Google = Google;
							}.call(this, module);
						},
					},
				},
			},
		},
		{ extensions: ['.js', '.json'] },
	);

	return {
		export() {
			return { Google };
		},
		require,
		eagerModulePaths: ['/node_modules/meteor/google-oauth/google_client.js', '/node_modules/meteor/google-oauth/namespace.js'],
		mainModulePath: '/node_modules/meteor/google-oauth/namespace.js',
	};
});
export const { Google } = Package['google-oauth'];
