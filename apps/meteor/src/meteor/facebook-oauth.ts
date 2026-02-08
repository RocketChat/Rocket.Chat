import { Meteor } from './meteor.ts';
import { meteorInstall } from './modules.ts';
import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';

Package['core-runtime'].queue('facebook-oauth', () => {
	let Facebook;

	const require = meteorInstall(
		{
			node_modules: {
				meteor: {
					'facebook-oauth': {
						'facebook_client.js'() {
							Facebook = {};

							Facebook.requestCredential = (options, credentialRequestCompleteCallback) => {
								let _Meteor$settings;
								let _Meteor$settings$publ;
								let _Meteor$settings$publ2;
								let _Meteor$settings$publ3;

								if (!credentialRequestCompleteCallback && typeof options === 'function') {
									credentialRequestCompleteCallback = options;
									options = {};
								}

								const config = ServiceConfiguration.configurations.findOne({ service: 'facebook' });

								if (!config) {
									credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());

									return;
								}

								const credentialToken = Random.secret();
								const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
								const display = mobile ? 'touch' : 'popup';
								let scope = 'email';

								if (options && options.requestPermissions) scope = options.requestPermissions.join(',');

								const loginStyle = OAuth._loginStyle('facebook', config, options);

								const API_VERSION =
									((_Meteor$settings = Meteor.settings) === null || _Meteor$settings === void 0
										? void 0
										: (_Meteor$settings$publ = _Meteor$settings.public) === null || _Meteor$settings$publ === void 0
											? void 0
											: (_Meteor$settings$publ2 = _Meteor$settings$publ.packages) === null || _Meteor$settings$publ2 === void 0
												? void 0
												: (_Meteor$settings$publ3 = _Meteor$settings$publ2['facebook-oauth']) === null || _Meteor$settings$publ3 === void 0
													? void 0
													: _Meteor$settings$publ3.apiVersion) || '17.0';

								let loginUrl =
									'https://www.facebook.com/v'.concat(API_VERSION, '/dialog/oauth?client_id=').concat(config.appId) +
									'&redirect_uri='.concat(OAuth._redirectUri('facebook', config, options.params, options.absoluteUrlOptions)) +
									'&display='.concat(display, '&scope=').concat(scope) +
									'&state='.concat(OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl));

								if (options && options.auth_type) {
									loginUrl += '&auth_type='.concat(encodeURIComponent(options.auth_type));
								}

								OAuth.launchLogin({
									loginService: 'facebook',
									loginStyle,
									loginUrl,
									credentialRequestCompleteCallback,
									credentialToken,
								});
							};
						},
					},
				},
			},
		},
		{ extensions: ['.js', '.json'] },
	);

	return {
		export() {
			return { Facebook };
		},
		require,
		eagerModulePaths: ['/node_modules/meteor/facebook-oauth/facebook_client.js'],
	};
});
export const { Facebook } = Package['facebook-oauth'];
