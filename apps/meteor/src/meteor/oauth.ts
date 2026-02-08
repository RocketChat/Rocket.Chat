import './meteor.ts';
import './check.ts';
import './url.ts';
import './reload.ts';
import './base64.ts';
import './modules.ts';
import { Package } from './package-registry.ts';

Package['core-runtime'].queue('oauth', function () {
	var Meteor = Package.meteor.Meteor;
	var check = Package.check.check;
	var URL = Package.url.URL;
	var Reload = Package.reload.Reload;
	var Base64 = Package.base64.Base64;
	var meteorInstall = Package.modules.meteorInstall;
	var OAuth;

	var require = meteorInstall(
		{
			node_modules: {
				meteor: {
					oauth: {
						'oauth_client.js'() {
							const credentialSecrets = {};

							OAuth = {};

							OAuth.showPopup = (url, callback, dimensions) => {
								throw new Error('OAuth.showPopup must be implemented on this arch.');
							};

							OAuth._loginStyle = (service, config, options) => {
								if (false) {
									return 'popup';
								}

								let loginStyle = (options && options.loginStyle) || config.loginStyle || 'popup';

								if (!['popup', 'redirect'].includes(loginStyle)) throw new Error('Invalid login style: '.concat(loginStyle));

								if (loginStyle === 'redirect') {
									try {
										sessionStorage.setItem('Meteor.oauth.test', 'test');
										sessionStorage.removeItem('Meteor.oauth.test');
									} catch (e) {
										loginStyle = 'popup';
									}
								}

								return loginStyle;
							};

							OAuth._stateParam = (loginStyle, credentialToken, redirectUrl) => {
								var _Meteor$settings, _Meteor$settings$publ, _Meteor$settings$publ2, _Meteor$settings$publ3;

								const state = {
									loginStyle,
									credentialToken,
									isCordova: false,
								};

								if (
									loginStyle === 'redirect' ||
									((_Meteor$settings = Meteor.settings) !== null &&
										_Meteor$settings !== void 0 &&
										(_Meteor$settings$publ = _Meteor$settings.public) !== null &&
										_Meteor$settings$publ !== void 0 &&
										(_Meteor$settings$publ2 = _Meteor$settings$publ.packages) !== null &&
										_Meteor$settings$publ2 !== void 0 &&
										(_Meteor$settings$publ3 = _Meteor$settings$publ2.oauth) !== null &&
										_Meteor$settings$publ3 !== void 0 &&
										_Meteor$settings$publ3.setRedirectUrlWhenLoginStyleIsPopup &&
										loginStyle === 'popup')
								) {
									state.redirectUrl = redirectUrl || '' + window.location;
								}

								return Base64.encode(JSON.stringify(state));
							};

							OAuth.saveDataForRedirect = (loginService, credentialToken) => {
								Reload._onMigrate('oauth', () => [
									true,
									{
										loginService,
										credentialToken,
									},
								]);
								Reload._migrate(null, {
									immediateMigration: true,
								});
							};

							OAuth.getDataAfterRedirect = () => {
								const migrationData = Reload._migrationData('oauth');

								if (!(migrationData && migrationData.credentialToken)) return null;

								const { credentialToken } = migrationData;
								const key = OAuth._storageTokenPrefix + credentialToken;
								let credentialSecret;

								try {
									credentialSecret = sessionStorage.getItem(key);
									sessionStorage.removeItem(key);
								} catch (e) {
									Meteor._debug('error retrieving credentialSecret', e);
								}

								return {
									loginService: migrationData.loginService,
									credentialToken,
									credentialSecret,
								};
							};

							OAuth.launchLogin = (options) => {
								if (!options.loginService) throw new Error('loginService required');

								if (options.loginStyle === 'popup') {
									OAuth.showPopup(
										options.loginUrl,
										options.credentialRequestCompleteCallback.bind(null, options.credentialToken),
										options.popupOptions,
									);
								} else if (options.loginStyle === 'redirect') {
									OAuth.saveDataForRedirect(options.loginService, options.credentialToken);
									window.location = options.loginUrl;
								} else {
									throw new Error('invalid login style');
								}
							};

							OAuth._handleCredentialSecret = (credentialToken, secret) => {
								check(credentialToken, String);
								check(secret, String);

								if (!Object.prototype.hasOwnProperty.call(credentialSecrets, credentialToken)) {
									credentialSecrets[credentialToken] = secret;
								} else {
									throw new Error('Duplicate credential token from OAuth login');
								}
							};

							OAuth._retrieveCredentialSecret = (credentialToken) => {
								let secret = credentialSecrets[credentialToken];

								if (!secret) {
									const localStorageKey = OAuth._storageTokenPrefix + credentialToken;

									secret = Meteor._localStorage.getItem(localStorageKey);
									Meteor._localStorage.removeItem(localStorageKey);
								} else {
									delete credentialSecrets[credentialToken];
								}

								return secret;
							};
						},

						'oauth_browser.js'() {
							OAuth.showPopup = (url, callback, dimensions) => {
								const popup = openCenteredPopup(url, (dimensions && dimensions.width) || 650, (dimensions && dimensions.height) || 331);

								const checkPopupOpen = setInterval(() => {
									let popupClosed;

									try {
										popupClosed = popup.closed || popup.closed === undefined;
									} catch (e) {
										return;
									}

									if (popupClosed) {
										clearInterval(checkPopupOpen);
										callback();
									}
								}, 100);
							};

							const openCenteredPopup = function (url, width, height) {
								const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
								const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
								const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
								const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.body.clientHeight - 22;
								const left = screenX + (outerWidth - width) / 2;
								const top = screenY + (outerHeight - height) / 2;
								const features =
									'width='.concat(width, ',height=').concat(height) + ',left='.concat(left, ',top=').concat(top, ',scrollbars=yes');
								const newwindow = window.open(url, 'Login', features);

								if (!newwindow || newwindow.closed) {
									const err = new Error('The login popup was blocked by the browser');

									err.attemptedUrl = url;

									throw err;
								}

								if (newwindow.focus) newwindow.focus();

								return newwindow;
							};
						},

						'oauth_common.js'(require, exports, module) {
							let _objectSpread;

							module.link(
								'@babel/runtime/helpers/objectSpread2',
								{
									default(v) {
										_objectSpread = v;
									},
								},
								0,
							);

							OAuth._storageTokenPrefix = 'Meteor.oauth.credentialSecret-';

							OAuth._redirectUri = (serviceName, config, params, absoluteUrlOptions) => {
								let isCordova = false;
								let isAndroid = false;

								if (params) {
									params = _objectSpread({}, params);
									isCordova = params.cordova;
									isAndroid = params.android;
									delete params.cordova;
									delete params.android;

									if (Object.keys(params).length === 0) {
										params = undefined;
									}
								}

								if (false && isCordova) {
									const url = Npm.require('url');
									let rootUrl = process.env.MOBILE_ROOT_URL || __meteor_runtime_config__.ROOT_URL;

									if (isAndroid) {
										const parsedRootUrl = url.parse(rootUrl);

										if (parsedRootUrl.hostname === 'localhost') {
											parsedRootUrl.hostname = '10.0.2.2';
											delete parsedRootUrl.host;
										}

										rootUrl = url.format(parsedRootUrl);
									}

									absoluteUrlOptions = _objectSpread(
										_objectSpread({}, absoluteUrlOptions),
										{},
										{
											rootUrl,
										},
									);
								}

								return URL._constructUrl(Meteor.absoluteUrl('_oauth/'.concat(serviceName), absoluteUrlOptions), null, params);
							};
						},
					},
				},
			},
		},
		{
			extensions: ['.js', '.json'],
		},
	);

	return {
		export() {
			return {
				OAuth,
			};
		},
		require,
		eagerModulePaths: [
			'/node_modules/meteor/oauth/oauth_client.js',
			'/node_modules/meteor/oauth/oauth_browser.js',
			'/node_modules/meteor/oauth/oauth_common.js',
		],
	};
});
export const { OAuth } = Package['oauth'];
