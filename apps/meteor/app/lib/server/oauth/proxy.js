import { OAuth } from 'meteor/oauth';

import { settings } from '../../../settings/server';

const { _redirectUri } = OAuth;

OAuth._redirectUri = function (serviceName, ...args) {
	const proxy = settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
	if (proxy.includes(serviceName)) {
		return `${settings.get('Accounts_OAuth_Proxy_host')}/oauth_redirect`;
	}
	return _redirectUri.call(this, serviceName, ...args);
};
