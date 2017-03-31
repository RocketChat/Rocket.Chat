Package.describe({
	name: 'rocketchat:autotranslate',
	version: '0.0.1',
	summary: 'Rocket.Chat automatic translations',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'ddp-rate-limiter',
		'less',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/stylesheets/autotranslate.less',
		'client/lib/autotranslate.js',
		'client/lib/actionButton.js',
		'client/lib/tabBar.js',
		'client/views/autoTranslateFlexTab.html',
		'client/views/autoTranslateFlexTab.js'
	], 'client');

	api.addFiles([
		'server/settings.js',
		'server/autotranslate.js',
		'server/permissions.js',
		'server/models/Messages.js',
		'server/models/Subscriptions.js',
		'server/methods/saveSettings.js',
		'server/methods/translateMessage.js',
		'server/methods/getSupportedLanguages.js'
	], 'server');
});
