Package.describe({
	name: 'rocketchat:colors',
	version: '0.0.1',
	summary: 'Message pre-processor that will process colors',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');

	api.addFiles('client/client.js', 'client');
	api.addFiles('client/style.css', 'client');
	api.addFiles('server/settings.js', 'server');
});
