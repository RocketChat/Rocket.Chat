Package.describe({
	name: 'rocketchat:smarsh-connector',
	version: '0.0.1',
	summary: 'Smarsh Connector',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
