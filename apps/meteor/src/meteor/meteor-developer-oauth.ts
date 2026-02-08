import { meteorInstall } from './modules.ts';
import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';

Package['core-runtime'].queue('meteor-developer-oauth', () => {
	let MeteorDeveloperAccounts;

	const require = meteorInstall(
		{
			node_modules: {
				meteor: {
					'meteor-developer-oauth': {
						'meteor_developer_common.js'() {
							MeteorDeveloperAccounts = {};
							MeteorDeveloperAccounts._server = 'https://www.meteor.com';

							MeteorDeveloperAccounts._config = (options) => {
								if (options.developerAccountsServer) {
									MeteorDeveloperAccounts._server = options.developerAccountsServer;
								}
							};
						},

						'meteor_developer_client.js'() {
							const requestCredential = (options, credentialRequestCompleteCallback) => {
								if (!credentialRequestCompleteCallback && typeof options === 'function') {
									credentialRequestCompleteCallback = options;
									options = null;
								}

								const config = ServiceConfiguration.configurations.findOne({ service: 'meteor-developer' });

								if (!config) {
									credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());

									return;
								}

								const credentialToken = Random.secret();
								const loginStyle = OAuth._loginStyle('meteor-developer', config, options);
								let loginUrl = `${MeteorDeveloperAccounts._server}/oauth2/authorize?${'state='.concat(
									OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl),
								)}&response_type=code&${'client_id='
									.concat(config.clientId)
									.concat(options && options.details ? '&details='.concat(options && options.details) : '')}`;

								if (options && options.userEmail && !options.loginHint) {
									options.loginHint = options.userEmail;
									delete options.userEmail;
								}

								if (options && options.loginHint) {
									loginUrl += '&user_email='.concat(encodeURIComponent(options.loginHint));
								}

								loginUrl += '&redirect_uri='.concat(OAuth._redirectUri('meteor-developer', config));

								OAuth.launchLogin({
									loginService: 'meteor-developer',
									loginStyle,
									loginUrl,
									credentialRequestCompleteCallback,
									credentialToken,
									popupOptions: { width: 497, height: 749 },
								});
							};

							MeteorDeveloperAccounts.requestCredential = requestCredential;
						},
					},
				},
			},
		},
		{ extensions: ['.js', '.json'] },
	);

	return {
		export() {
			return { MeteorDeveloperAccounts };
		},
		require,
		eagerModulePaths: [
			'/node_modules/meteor/meteor-developer-oauth/meteor_developer_common.js',
			'/node_modules/meteor/meteor-developer-oauth/meteor_developer_client.js',
		],
	};
});
export const { MeteorDeveloperAccounts } = Package['meteor-developer-oauth'];
