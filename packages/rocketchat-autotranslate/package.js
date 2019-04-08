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
		'rocketchat:lib',
		'templating',
		'rocketchat:utils',
	]);
	api.addFiles('client/stylesheets/autotranslate.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});

/**
 * Package-level dependencies
 * cld - Text language detector
 */
Npm.depends({
	cld: '2.4.8',
});

