import _ from 'underscore';
import { OAuth } from 'meteor/oauth';

import { settings } from '../../../settings';

OAuth._redirectUri = _.wrap(OAuth._redirectUri, function (func, serviceName, ...args) {
	const proxy = settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
	if (proxy.includes(serviceName)) {
		return `${settings.get('Accounts_OAuth_Proxy_host')}/oauth_redirect`;
	}
	return func(serviceName, ...args);
});
