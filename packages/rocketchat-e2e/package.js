Package.describe({
	name: 'rocketchat:e2e',
	version: '0.0.1',
	summary: 'End-to-End encrypted conversations for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'mizzao:timesync',
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:notifications',
		'rocketchat:authorization',
		'rocketchat:callbacks',
		'rocketchat:settings',
		'rocketchat:promises',
		'rocketchat:ui-utils',
		'templating',
		'sha',
	]);
	api.addFiles('client/stylesheets/e2e.less', 'client');
	api.mainModule('client/rocketchat.e2e.js', 'client');
	api.mainModule('server/index.js', 'server');
});
