Package.describe({
	name: 'rocketchat:autotranslate',
	version: '0.0.1',
	summary: 'Rocket.Chat automatic translations',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'ddp-rate-limiter',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:callbacks',
		'rocketchat:authorization',
		'rocketchat:ui-utils',
		'rocketchat:ui-cached-collection',
		'templating',
		'rocketchat:utils',
		'rocketchat:markdown',
	]);
	api.addFiles('client/stylesheets/autotranslate.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
