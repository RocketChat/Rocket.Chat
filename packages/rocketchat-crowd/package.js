Package.describe({
	name: 'rocketchat:crowd',
	version: '1.0.0',
	summary: 'Accounts login handler for crowd using atlassian-crowd-client from npm',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:logger',
		'rocketchat:lib',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:authorization',
		'ecmascript',
		'sha',
		'templating',
		'accounts-base',
		'accounts-password',
		'littledata:synced-cron',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
