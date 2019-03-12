Package.describe({
	name: 'rocketchat:autolinker',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate links on messages',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:callbacks',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
