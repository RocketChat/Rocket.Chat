Package.describe({
	name: 'rocketchat:channel-settings',
	version: '0.0.1',
	summary: 'Channel Settings Panel',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'reactive-var',
		'tracker',
		'templating',
		'rocketchat:lib',
		'rocketchat:authorization',
		'rocketchat:ui',
		'rocketchat:ui-utils',
		'rocketchat:utils',
		'rocketchat:models',
	]);
	api.addFiles('client/stylesheets/channel-settings.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
