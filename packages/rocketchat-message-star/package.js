Package.describe({
	name: 'rocketchat:message-star',
	version: '0.0.1',
	summary: 'Star Messages',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:ui-utils',
		'templating',
	]);
	api.addFiles('client/views/stylesheets/messagestar.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
