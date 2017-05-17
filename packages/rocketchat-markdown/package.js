Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.1',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'templating',
		'underscorestring:underscore.string',
		'rocketchat:lib'
	]);

	api.addFiles('settings.js', 'server');
	api.addFiles('markdown.js');
	api.addFiles('markdowncode.js');
});

Package.onTest(function(api) {
	api.use([
		'sanjo:jasmine@0.20.2',
		'rocketchat:lib',
		'rocketchat:markdown'
	]);

	api.addFiles('tests/jasmine/client/unit/markdown.spec.js', 'client');
});
