Package.describe({
	name: 'rocketchat:importer-hipchat',
	version: '0.0.1',
	summary: 'Importer for HipChat',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'rocketchat:lib',
		'rocketchat:importer'
	]);
	api.use('aldeed:moment-timezone', 'server');
	api.use('rocketchat:logger', 'server');
	api.addFiles('server.coffee', 'server');
	api.addFiles('main.coffee', ['client', 'server']);
});
