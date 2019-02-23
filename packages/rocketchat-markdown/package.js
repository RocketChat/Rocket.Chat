Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.2',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:settings',
		'rocketchat:callbacks',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
