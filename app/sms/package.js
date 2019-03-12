Package.describe({
	name: 'rocketchat:sms',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
	]);
	api.mainModule('server/index.js', 'server');
});
