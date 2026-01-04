import { OAuth } from 'meteor/oauth';

import { settings } from '../../../client/lib/settings';

OAuth.launchLogin = ((func) =>
	function (options) {
		const proxy = settings.peek('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
		if (proxy.includes(options.loginService)) {
			const redirectUri = options.loginUrl.match(/(&redirect_uri=)([^&]+|$)/)?.[2];
			options.loginUrl = options.loginUrl.replace(
				/(&redirect_uri=)([^&]+|$)/,
				`$1${encodeURIComponent(settings.peek('Accounts_OAuth_Proxy_host') ?? '')}/oauth_redirect`,
			);
			options.loginUrl = options.loginUrl.replace(/(&state=)([^&]+|$)/, `$1${redirectUri}!$2`);
			options.loginUrl = `${settings.peek('Accounts_OAuth_Proxy_host')}/redirect/${encodeURIComponent(options.loginUrl)}`;
		}

		return func(options);
	})(OAuth.launchLogin.bind(OAuth));
