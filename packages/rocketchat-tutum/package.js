Package.describe({
	name: 'rocketchat:tutum',
	version: '0.0.1',
	summary: 'RocketChat tutum integration'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.addFiles('startup.js', 'server');
});
