import { OAuth } from 'meteor/oauth';
import _ from 'underscore';

import { settings } from '../../../settings/server';

OAuth._redirectUri = _.wrap(OAuth._redirectUri, (func, serviceName, ...args) => {
	const proxy = settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
	if (proxy.includes(serviceName)) {
		return `${settings.get('Accounts_OAuth_Proxy_host')}/oauth_redirect`;
	}
	return func(serviceName, ...args);
});
