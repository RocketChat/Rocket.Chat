Package.describe({
	name: 'rocketchat:importer-csv',
	version: '1.0.0',
	summary: 'Importer for CSV Files',
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

Npm.depends({
	'csv-parse': '1.2.0'
});
