Package.describe({
	name: 'rocketchat:autolinker',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate links on messages',
	git: ''
});

Npm.depends({
	autolinker: '1.6.0'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');

	api.addFiles('client/client.js', 'client');

	api.addFiles('server/settings.js', 'server');
});
