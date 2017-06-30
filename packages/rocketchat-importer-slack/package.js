Package.describe({
	name: 'rocketchat:importer-slack',
	version: '0.0.1',
	summary: 'Importer for Slack',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:importer'
	]);
	api.use('rocketchat:logger', 'server');
	api.addFiles('server.js', 'server');
	api.addFiles('main.js', ['client', 'server']);
});
