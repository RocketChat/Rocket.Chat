import { RocketChat } from 'meteor/rocketchat:lib';
import { Accounts } from 'meteor/accounts-base';
import { IframeLogin } from 'meteor/rocketchat:ui-utils';
import _ from 'underscore';

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = function(...args) {
	RocketChat.iframeLogin.tryLogin();
	_unstoreLoginToken.apply(Accounts, args);
};

RocketChat.iframeLogin = new IframeLogin();

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
	}
});
