Package.describe({
	name: 'rocketchat:cors',
	version: '0.0.1',
	summary: 'Enable CORS',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'webapp'
	]);

	api.addFiles('cors.coffee', 'server');
	api.addFiles('common.coffee');
});
