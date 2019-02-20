Package.describe({
	name: 'rocketchat:reactions',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:emoji',
		'rocketchat:models',
		'rocketchat:callbacks',
		'rocketchat:theme',
		'rocketchat:tooltip',
		'rocketchat:ui-utils',
		'rocketchat:lib',
	]);
	api.addFiles('client/stylesheets/reaction.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
