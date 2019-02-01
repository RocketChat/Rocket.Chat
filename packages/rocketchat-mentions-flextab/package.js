Package.describe({
	name: 'rocketchat:mentions-flextab',
	version: '0.0.1',
	summary: 'Mentions Flextab',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'less',
		'rocketchat:models',
		'rocketchat:ui-utils',
		'templating',
	]);
	api.addFiles('client/views/stylesheets/mentionsFlexTab.less', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
