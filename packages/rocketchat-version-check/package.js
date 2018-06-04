Package.describe({
	name: 'rocketchat:version-check',
	version: '0.0.1',
	summary: 'Check for new avaiable versions',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:logger',
		'percolate:synced-cron'
	]);

	api.mainModule('client/client.js', 'client');
	api.mainModule('server/server.js', 'server');
});
