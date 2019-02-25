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
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/stylesheets/autotranslate.css',
		'client/lib/autotranslate.js',
		'client/lib/actionButton.js',
		'client/lib/tabBar.js',
		'client/views/autoTranslateFlexTab.html',
		'client/views/autoTranslateFlexTab.js',
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/permissions.js',
		'server/autotranslate.js',
		'server/googleTranslate.js',
		'server/deeplTranslate.js',
		'server/dbsTranslate.js',
		'server/models/Messages.js',
		'server/models/Settings.js',
		'server/models/Subscriptions.js',
		'server/methods/getProviderUiMetadata.js',
		'server/methods/saveSettings.js',
		'server/methods/translateMessage.js',
		'server/methods/getSupportedLanguages.js',
	], 'server');
	api.mainModule('server/index.js', 'server');
});

/**
 * Package-level dependencies
 * cld - Text language detector
 */
Npm.depends({
	cld: '2.4.8',
});

