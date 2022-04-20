import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

import { IframeLogin } from '../../ui-utils';

const iframeLogin = new IframeLogin();

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = function (...args) {
	iframeLogin.tryLogin();
	_unstoreLoginToken.apply(Accounts, args);
};

window.addEventListener('message', (e) => {
	if (!_.isObject(e.data)) {
		return;
	}

	switch (e.data.event) {
		case 'try-iframe-login':
			iframeLogin.tryLogin((error) => {
				if (error) {
					e.source.postMessage(
						{
							event: 'login-error',
							response: error.message,
						},
						e.origin,
					);
				}
			});
			break;

		case 'login-with-token':
			iframeLogin.loginWithToken(e.data, (error) => {
				if (error) {
					e.source.postMessage(
						{
							event: 'login-error',
							response: error.message,
						},
						e.origin,
					);
				}
			});
			break;
	}
});
