Package.describe({
	name: 'rocketchat:custom-sounds',
	version: '1.0.0',
	summary: 'Custom sounds',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:file',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:authorization',
		'rocketchat:notifications',
		'rocketchat:ui-cached-collection',
		'rocketchat:ui-utils',
		'templating',
		'reactive-var',
		'webapp',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);
	api.addFiles('assets/stylesheets/customSoundsAdmin.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
