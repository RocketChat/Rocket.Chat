Package.describe({
	name: 'rocketchat:importer-csv',
	version: '1.0.0',
	summary: 'Importer for CSV Files',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:models',
		'rocketchat:importer',
		'rocketchat:logger',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
