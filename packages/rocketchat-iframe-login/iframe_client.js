/* globals Accounts, Tracker, ReactiveVar, FlowRouter, Accounts, HTTP, facebookConnectPlugin, TwitterConnect, OAuth */

const _unstoreLoginToken = Accounts._unstoreLoginToken;
Accounts._unstoreLoginToken = function() {
	RocketChat.iframeLogin.tryLogin();
	_unstoreLoginToken.apply(Accounts, arguments);
};

class IframeLogin {
	constructor() {
		this.enabled = false;
		this.reactiveIframeUrl = new ReactiveVar();
		this.reactiveEnabled = new ReactiveVar();
		this.iframeUrl = undefined;
		this.apiUrl = undefined;
		this.apiMethod = undefined;

		Tracker.autorun((c) => {
			this.enabled = RocketChat.settings.get('Accounts_iframe_enabled');
			this.reactiveEnabled.set(this.enabled);

			this.iframeUrl = RocketChat.settings.get('Accounts_iframe_url');
			this.apiUrl = RocketChat.settings.get('Accounts_Iframe_api_url');
			this.apiMethod = RocketChat.settings.get('Accounts_Iframe_api_method');

			if (this.enabled === false) {
				return c.stop();
			}

			if (this.enabled === true && this.iframeUrl && this.apiUrl && this.apiMethod && FlowRouter.subsReady('userData', 'activeUsers')) {
				c.stop();
				if (!Accounts._storedLoginToken()) {
					this.tryLogin(() => {});
				}
			}
		});
	}

	tryLogin(callback) {
		if (!this.enabled) {
			return;
		}

		if (!this.iframeUrl || !this.apiUrl || !this.apiMethod) {
			return;
		}

		console.log('tryLogin');
		const options = {
			beforeSend: (xhr) => {
				xhr.withCredentials = true;
			}
		};

		let iframeUrl = this.iframeUrl;
		let separator = '?';
		if (iframeUrl.indexOf('?') > -1) {
			separator = '&';
		}

		if (window.cordova) {
			iframeUrl += separator + 'client=cordova';
		} else if (navigator.userAgent.indexOf('Electron') > -1) {
			iframeUrl += separator + 'client=electron';
		}

		HTTP.call(this.apiMethod, this.apiUrl, options, (error, result) => {
			console.log(error, result);
			if (result && result.data && result.data.token) {
				// TODO get from api
				result.data.token = 'yaMadZ1RMBdMzs6kGycKybrHVptoDl7nokxtorz1me0';
				this.loginWithToken(result.data.token, (error, result) => {
					if (error) {
						this.reactiveIframeUrl.set(iframeUrl);
					} else {
						this.reactiveIframeUrl.set();
					}
					callback(error, result);
				});
			} else {
				this.reactiveIframeUrl.set(iframeUrl);
				callback(error, result);
			}
		});
	}

	loginWithToken(token, callback) {
		if (!this.enabled) {
			return;
		}

		console.log('loginWithToken');
		Accounts.callLoginMethod({
			methodArguments: [{
				iframe: true,
				token: token
			}],
			userCallback: (err) => {
				if (err) {
					callback(err);
				}
			}
		});
	}
}

RocketChat.iframeLogin = new IframeLogin();

const requestCredential = (serviceName, options = {}, callback) => {
	window[serviceName].requestCredential(options, (tokenOrError) => {
		if (tokenOrError && tokenOrError instanceof Error) {
			return callback(tokenOrError);
		}

		const secret = OAuth._retrieveCredentialSecret(tokenOrError);

		if (!secret) {
			return callback(new Error('Invalid secret'));
		}

		Meteor.call('OAuth.retrieveCredential', tokenOrError, secret, (error, credential) => {
			if (!credential) {
				return callback(new Error('Credential not found'));
			}

			callback(credential.serviceData, tokenOrError, secret);
		});
	});
};

window.addEventListener('message', (e) => {
	if (! _.isObject(e.data)) {
		return;
	}

	console.log(e);

	switch (e.data.event) {
		case 'try-iframe-login':
			RocketChat.iframeLogin.tryLogin((error) => {
				if (error) {
					e.source.postMessage({
						event: 'login-error',
						response: error.message
					}, e.origin);
				}
			});
			break;

		case 'loggin-with-token':
			RocketChat.iframeLogin.loginWithToken(e.data.token, (error) => {
				if (error) {
					e.source.postMessage({
						event: 'login-error',
						response: error.message
					}, e.origin);
				}
			});
			break;

		case 'call-facebook-login':
			const fbLoginSuccess = (response) => {
				console.log('facebook-login-success', response);
				e.source.postMessage({
					event: 'facebook-login-success',
					response: response
					// authResponse: Object
					// 	accessToken: "a7s6d8a76s8d7..."
					// 	expiresIn: "5172793"
					// 	secret: "..."
					// 	session_key: true
					// 	sig: "..."
					// userID: "675676576"
					// status: "connected"
				}, e.origin);
			};

			const fbLoginError = (error, response) => {
				console.log('facebook-login-error', error, response);
				e.source.postMessage({
					event: 'facebook-login-error',
					error: error,
					response: response
				}, e.origin);
			};

			if (typeof window.facebookConnectPlugin === 'undefined') {
				requestCredential('Facebook', {}, (serviceData, token, secret) => {
					if (serviceData && serviceData instanceof Error) {
						return fbLoginError('poup-login-error', serviceData);
					} else {
						fbLoginSuccess({
							authResponse: {
								accessToken: serviceData.accessToken,
								expiresIn: serviceData.expiresAt,
								secret: secret
							},
							userID: serviceData.id
						});
					}
				});
				break;
			}

			facebookConnectPlugin.getLoginStatus((response) => {
				if (response.status === 'connected') {
					return fbLoginSuccess(response);
				}

				facebookConnectPlugin.login(e.data.permissions, fbLoginSuccess, (error) => {
					return fbLoginError('login-error', error);
				});
			}, (error) => {
				return fbLoginError('get-status-error', error);
			});
			break;

		case 'call-twitter-login':
			const twitterLoginSuccess = (response) => {
				console.log('twitter-login-success', response);
				e.source.postMessage({
					event: 'twitter-login-success',
					response: response
					// {
					// 	"userName": "orodrigok",
					// 	"userId": 293123,
					// 	"secret": "asdua09sud",
					// 	"token": "2jh3k1j2h3"
					// }
				}, e.origin);
			};

			const twitterLoginFailure = (error) => {
				console.log('twitter-login-error', error);
				e.source.postMessage({
					event: 'twitter-login-error',
					error: error
				}, e.origin);
			};

			if (typeof window.TwitterConnect === 'undefined') {
				requestCredential('Twitter', {}, (serviceData) => {
					if (serviceData && serviceData instanceof Error) {
						return twitterLoginFailure('poup-login-error', serviceData);
					} else {
						twitterLoginSuccess({
							userName: serviceData.screenName,
							userId: serviceData.id,
							secret: serviceData.accessTokenSecret,
							token: serviceData.accessToken
						});
					}
				});
				break;
			}

			TwitterConnect.login(twitterLoginSuccess, twitterLoginFailure);
			break;

		case 'call-google-login':
			const googleLoginSuccess = (response) => {
				console.log('google-login-success', response);
				e.source.postMessage({
					event: 'google-login-success',
					response: response
					// {
					// 	"email": "rodrigoknascimento@gmail.com",
					// 	"userId": "1082039180239",
					// 	"displayName": "Rodrigo Nascimento",
					// 	"gender": "male",
					// 	"imageUrl": "https://lh5.googleusercontent.com/-shUpniJA480/AAAAAAAAAAI/AAAAAAAAAqY/_B8oyS8yBw0/photo.jpg?sz=50",
					// 	"givenName": "Rodrigo",
					// 	"familyName": "Nascimento",
					// 	"ageRangeMin": 21,
					// 	"oauthToken": "123198273kajhsdh1892h"
					// }
				}, e.origin);
			};

			const googleLoginFailure = (error) => {
				console.log('google-login-error', error);
				e.source.postMessage({
					event: 'google-login-error',
					error: error
				}, e.origin);
			};

			if (typeof window.plugins.googleplus === 'undefined') {
				requestCredential('Google', {}, (serviceData) => {
					if (serviceData && serviceData instanceof Error) {
						return googleLoginFailure('poup-login-error', serviceData);
					} else {
						googleLoginSuccess({
							email: serviceData.email,
							userId: serviceData.id,
							displayName: serviceData.name,
							gender: serviceData.gender,
							imageUrl: serviceData.picture,
							givenName: serviceData.given_name,
							familyName: serviceData.family_name,
							oauthToken: serviceData.accessToken
						});
					}
				});
				break;
			}

			const options = {
				scopes: e.data.scopes,
				webClientId: e.data.webClientId,
				offline: true
			};

			window.plugins.googleplus.login(options, googleLoginSuccess, googleLoginFailure);
			break;
	}
});
