Package.describe({
	name: 'rocketchat:katex',
	version: '0.0.1',
	summary: 'KaTeX plugin for TeX math rendering',
	git: ''
});

Package.onUse(function(api) {
	api.use('coffeescript');
	api.use('ecmascript');
	api.use('underscore');
	api.use('templating');
	api.use('underscorestring:underscore.string');
	api.use('rocketchat:lib');

	api.addFiles('settings.coffee', 'server');
	api.addFiles('katex.coffee');
	api.addFiles(['client/style.dependencies.js', 'client/style.css'], 'client');
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.use('rocketchat:katex');

	api.addFiles('tests/jasmine/client/unit/katex.spec.coffee', 'client');
});
