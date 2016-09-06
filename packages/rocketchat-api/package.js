Package.describe({
	name: 'rocketchat:api',
	version: '0.0.1',
	summary: 'Rest API',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'nimble:restivus'
	]);

	api.addFiles('server/api.coffee', 'server');
	api.addFiles('server/routes.coffee', 'server');
});
