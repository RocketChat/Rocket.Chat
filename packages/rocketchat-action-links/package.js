Package.describe({
	name: 'rocketchat:action-links',
	version: '0.0.1',
	summary: 'Add custom actions that call functions',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:ui-utils',
		'rocketchat:utils',
		'rocketchat:theme',
		'rocketchat:models',
	]);
	api.addFiles('client/stylesheets/actionLinks.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
