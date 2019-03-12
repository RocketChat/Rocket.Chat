Package.describe({
	name: 'rocketchat:ui-vrecord',
	version: '0.0.1',
	description: 'Video upload with on the fly recording',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'tracker',
		'rocketchat:settings',
		'rocketchat:ui',
	]);
	api.addFiles('client/vrecord.css', 'client');
	api.mainModule('server/index.js', 'server');
	api.mainModule('client/index.js', 'client');
});
