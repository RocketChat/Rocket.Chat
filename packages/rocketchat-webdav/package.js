Package.describe({
	name: 'rocketchat:webdav',
	version: '0.0.1',

	summary: 'Package for RocketChat users to interact with WebDAV servers.',

	git: '',

	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'mongo',
		'templating',
		'less',
		'rocketchat:utils',
		'rocketchat:ui-utils',
		'rocketchat:lib',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:api',
		'rocketchat:grant',
		'rocketchat:file-upload',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
