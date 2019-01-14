import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Accounts } from 'meteor/accounts-base';
import { IframeLogin } from 'meteor/rocketchat:ui-utils';
import { OAuth } from 'meteor/oauth';
import _ from 'underscore';

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = function(...args) {
	RocketChat.iframeLogin.tryLogin();
	_unstoreLoginToken.apply(Accounts, args);
};

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

	switch (e.data.event) {
		case 'try-iframe-login':
			RocketChat.iframeLogin.tryLogin((error) => {
				if (error) {
					e.source.postMessage({
						event: 'login-error',
						response: error.message,
					}, e.origin);
				}
			});
			break;

		case 'login-with-token':
			RocketChat.iframeLogin.loginWithToken(e.data, (error) => {
				if (error) {
					e.source.postMessage({
						event: 'login-error',
						response: error.message,
					}, e.origin);
				}
			});
			break;

		case 'call-facebook-login':
			const fbLoginSuccess = (response) => {
				console.log('facebook-login-success', response);
				e.source.postMessage({
					event: 'facebook-login-success',
					response,
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
					error,
					response,
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
								secret,
							},
							userID: serviceData.id,
						});
					}
				});
				break;
			}

			facebookConnectPlugin.getLoginStatus((response) => {
				if (response.status === 'connected') {
					return fbLoginSuccess(response);
				}

				facebookConnectPlugin.login(e.data.permissions, fbLoginSuccess, (error) => fbLoginError('login-error', error));
			}, (error) => fbLoginError('get-status-error', error));
			break;

		case 'call-twitter-login':
			const twitterLoginSuccess = (response) => {
				console.log('twitter-login-success', response);
				e.source.postMessage({
					event: 'twitter-login-success',
					response,
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
					error,
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
							token: serviceData.accessToken,
						});
					}
				});
				break;
			}

			TwitterConnect.login(twitterLoginSuccess, twitterLoginFailure);
			break;

		case 'call-google-login':
			const googleLoginSuccess = (response) => {
				if (typeof response.oauthToken === 'string' && typeof response.accessToken !== 'string') {
					response.accessToken = response.oauthToken;
				}

				console.log('google-login-success', response);
				e.source.postMessage({
					event: 'google-login-success',
					response,
					// {
					// 	"email": "rodrigoknascimento@gmail.com",
					// 	"userId": "1082039180239",
					// 	"displayName": "Rodrigo Nascimento",
					// 	"gender": "male",
					// 	"imageUrl": "https://lh5.googleusercontent.com/-shUpniJA480/AAAAAAAAAAI/AAAAAAAAAqY/_B8oyS8yBw0/photo.jpg?sz=50",
					// 	"givenName": "Rodrigo",
					// 	"familyName": "Nascimento",
					// 	"ageRangeMin": 21,
					// 	"accessToken": "123198273kajhsdh1892h"
					// }
				}, e.origin);
			};

			const googleLoginFailure = (error) => {
				console.log('google-login-error', error);
				e.source.postMessage({
					event: 'google-login-error',
					error,
				}, e.origin);
			};

			if (typeof window.plugins === 'undefined' || typeof window.plugins.googleplus === 'undefined') {
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
							accessToken: serviceData.accessToken,
						});
					}
				});
				break;
			}

			const options = {
				scopes: e.data.scopes,
				webClientId: e.data.webClientId,
				offline: true,
			};

			window.plugins.googleplus.login(options, googleLoginSuccess, googleLoginFailure);
			break;
	}
});
