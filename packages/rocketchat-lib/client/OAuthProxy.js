/* globals OAuth */

OAuth.launchLogin = _.wrap(OAuth.launchLogin, function(func, options) {
	const proxy = RocketChat.settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');
	if (proxy.includes(options.loginService)) {
		const redirect_uri = options.loginUrl.match(/(&redirect_uri=)([^&]+|$)/)[2];
		options.loginUrl = options.loginUrl.replace(/(&redirect_uri=)([^&]+|$)/, `$1${encodeURIComponent(RocketChat.settings.get('Accounts_OAuth_Proxy_host'))}/oauth_redirect`);
		options.loginUrl = options.loginUrl.replace(/(&state=)([^&]+|$)/, `$1${redirect_uri}!$2`);
		options.loginUrl = RocketChat.settings.get('Accounts_OAuth_Proxy_host')+'/redirect/'+encodeURIComponent(options.loginUrl);
	}

	return func(options);
});
