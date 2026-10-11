import { OAuth } from 'meteor/oauth';

import { settings } from '../../lib/settings';

OAuth.launchLogin = ((func) =>
	function (options) {
		// Settings might not be loaded yet; in that case, just skip the proxying
		const proxiedServices = settings.peek<string>('Accounts_OAuth_Proxy_services')?.replace(/\s/g, '').split(',') ?? [];
		const proxyHost = settings.peek<string>('Accounts_OAuth_Proxy_host');

		if (proxyHost && proxiedServices.includes(options.loginService)) {
			const redirectUri = options.loginUrl.match(/(&redirect_uri=)([^&]+|$)/)?.[2];
			options.loginUrl = options.loginUrl.replace(/(&redirect_uri=)([^&]+|$)/, `$1${encodeURIComponent(proxyHost)}/oauth_redirect`);
			options.loginUrl = options.loginUrl.replace(/(&state=)([^&]+|$)/, `$1${redirectUri}!$2`);
			options.loginUrl = `${proxyHost}/redirect/${encodeURIComponent(options.loginUrl)}`;
		}

		return func(options);
	})(OAuth.launchLogin.bind(OAuth));
