Package.describe({
	name: 'rocketchat:colors',
	version: '0.0.1',
	summary: 'Message pre-processor that will process colors',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:callbacks',
	]);
	api.addFiles('client/style.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
