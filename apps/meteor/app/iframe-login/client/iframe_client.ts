import { Accounts } from 'meteor/accounts-base';

import { IframeLogin } from '../../ui-utils/client';

const iframeLogin = new IframeLogin();

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = function (...args) {
	iframeLogin.tryLogin();
	_unstoreLoginToken.apply(Accounts, args);
};

window.addEventListener('message', (e) => {
	if (!(typeof e.data === 'function' || (typeof e.data === 'object' && !!e.data))) {
		return;
	}

	switch (e.data.event) {
		case 'try-iframe-login':
			iframeLogin.tryLogin((error) => {
				if (error) {
					e.source?.postMessage(
						{
							event: 'login-error',
							response: error.message,
						},
						{ targetOrigin: e.origin },
					);
				}
			});
			break;

		case 'login-with-token':
			iframeLogin.loginWithToken(e.data, (error) => {
				if (error) {
					e.source?.postMessage(
						{
							event: 'login-error',
							response: error.message,
						},
						{ targetOrigin: e.origin },
					);
				}
			});
			break;
	}
});
