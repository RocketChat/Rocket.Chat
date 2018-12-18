Package.describe({
	name: 'rocketchat:importer-slack-users',
	version: '1.0.0',
	summary: 'Importer for Slack\'s CSV User Export',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:importer',
		'rocketchat:logger',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
