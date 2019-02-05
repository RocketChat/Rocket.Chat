Package.describe({
	name: 'rocketchat:tokenpass',
	version: '0.0.1',
	summary: 'RocketChat settings for Tokenpass OAuth flow',
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'ecmascript',
		'accounts-base',
		'service-configuration',
		'templating',
		'littledata:synced-cron',
		'rocketchat:utils',
		'rocketchat:lib',
		'rocketchat:authorization',
		'rocketchat:custom-oauth',
		'rocketchat:channel-settings',
	]);
	api.addFiles('client/login-button.css', 'client');
	api.addFiles('client/channelSettings.css', 'client');
	api.addFiles('client/styles.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
