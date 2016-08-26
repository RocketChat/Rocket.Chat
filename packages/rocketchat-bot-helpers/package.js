Package.describe({
	name: 'rocketchat:bot-helpers',
	version: '0.0.1',
	summary: 'Add some helper methods to Rocket.Chat for bots to use.',
	git: 'https://github.com/timkinnane/rocketchat-bot-helpers'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2');
	// api.versionsFrom('1.3'); // when release
	api.use('ecmascript');
	api.use('underscore');
	api.use('rocketchat:lib');
	api.use('accounts-base');
	// api.mainModule('server/index.js', 'server'); // when 1.3
	// api.mainModule('client/index.js', 'client'); // when 1.3
	api.addFiles([
		'server/index.js',
		'server/settings.js'
	], ['server']);
});
