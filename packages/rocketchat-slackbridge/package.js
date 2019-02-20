Package.describe({
	name: 'rocketchat:slackbridge',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:utils',
		'rocketchat:lib',
		'rocketchat:callbacks',
		'rocketchat:channel-settings',
		'rocketchat:models',
		'rocketchat:logger',
		'rocketchat:file-upload',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
