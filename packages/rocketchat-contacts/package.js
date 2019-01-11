Package.describe({
	name: 'rocketchat:contacts',
	version: '0.0.1',
	git: '',
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');

	api.addFiles('server/index.js', 'server');
	api.addFiles('server/service.js', 'server');
	api.addFiles('server/startup.js', 'server');
});
