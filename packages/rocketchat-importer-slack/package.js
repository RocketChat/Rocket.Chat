Package.describe({
	name: 'rocketchat:importer-slack',
	version: '0.0.1',
	summary: 'Importer for Slack',
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
