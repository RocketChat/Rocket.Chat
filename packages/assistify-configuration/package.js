Package.describe({
	name: 'assistify:configuration',
	version: '0.0.2',
	summary: 'Default configuration of Rocket.Chat for Assistify',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('assistify:ai');

	api.addFiles('server/config.js', 'server');
	api.addFiles('server/roles.js', 'server');
});
