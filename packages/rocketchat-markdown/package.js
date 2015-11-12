Package.describe({
	name: 'rocketchat:markdown',
	version: '0.0.1',
	summary: 'Message pre-processor that will process selected markdown notations',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');
	api.use('underscore');
	api.use('underscorestring:underscore.string');
	api.use('rocketchat:lib@0.0.1');

	api.addFiles('settings.coffee', 'server');
	api.addFiles('markdown.coffee');
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.use('rocketchat:markdown');

	api.addFiles('tests/jasmine/client/unit/markdown.spec.coffee', 'client');
});
