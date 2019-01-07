Package.describe({
	name: 'rocketchat:api',
	version: '0.0.1',
	summary: 'Rest API',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'nimble:restivus',
		'rocketchat:lib',
		'rocketchat:integrations',
		'rocketchat:file-upload',
	]);

	api.mainModule('server/index.js', 'server');
});
