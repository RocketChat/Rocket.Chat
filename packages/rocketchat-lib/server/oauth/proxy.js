/* globals OAuth */
import _ from 'underscore';

OAuth._redirectUri = _.wrap(OAuth._redirectUri, function(func, serviceName, ...args) {
	const proxy = RocketChat.settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
	if (proxy.includes(serviceName)) {
		return `${ RocketChat.settings.get('Accounts_OAuth_Proxy_host') }/oauth_redirect`;
	} else {
		return func(serviceName, ...args);
	}

});
