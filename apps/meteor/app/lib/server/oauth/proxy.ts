import { OAuth } from 'meteor/oauth';

import { settings } from '../../../settings/server';

OAuth._redirectUri = ((func: (serviceName: string, ...args: any[]) => string) => {
	return (serviceName: string, ...args: any[]): string => {
		const proxy = settings.get<string>('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
		if (proxy.includes(serviceName)) {
			return `${settings.get('Accounts_OAuth_Proxy_host')}/oauth_redirect`;
		}
		return func(serviceName, ...args);
	};
})(OAuth._redirectUri);
