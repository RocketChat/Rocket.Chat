Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.1',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'ecmascript',
		'underscore',
		'templating',
		'underscorestring:underscore.string',
		'rocketchat:lib'
	]);

	api.addFiles('settings.coffee', 'server');
	api.addFiles('markdown.coffee');
	api.addFiles('markdowncode.coffee');
});

Package.onTest(function(api) {
	api.use([
		'coffeescript',
		'sanjo:jasmine@0.20.2',
		'rocketchat:lib',
		'rocketchat:markdown'
	]);

	api.addFiles('tests/jasmine/client/unit/markdown.spec.coffee', 'client');
});
