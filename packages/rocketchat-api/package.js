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
		'rate-limit',
		'rocketchat:lib',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:assets',
		'rocketchat:utils',
		'rocketchat:metrics',
		'rocketchat:authorization',
		'rocketchat:file-upload',
	]);
	api.mainModule('server/index.js', 'server');
});
