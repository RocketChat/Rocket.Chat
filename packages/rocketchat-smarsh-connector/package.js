Package.describe({
	name: 'rocketchat:smarsh-connector',
	version: '0.0.1',
	summary: 'Smarsh Connector',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'jalik:ufs',
		'littledata:synced-cron',
		'rocketchat:mailer',
		'rocketchat:ui-utils',
		'rocketchat:models',
		'rocketchat:settings',
	]);
	api.mainModule('server/index.js', 'server');
});
