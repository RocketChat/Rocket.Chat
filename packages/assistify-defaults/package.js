Package.describe({
	name: 'assistify:defaults',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: 'Default configuration of Rocket.Chat for Assistify',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:authorization');
	api.use('assistify:help-request');
	api.use('assistify:ai');

	api.addFiles('server/config.js', 'server');
	api.addFiles('server/roles.js', 'server');
});
