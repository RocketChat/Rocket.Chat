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
	api.addFiles('client/style.css', 'client');

	var katexPath = 'node_modules/katex/dist/';
	api.addFiles(katexPath + 'katex.min.css', 'client');

	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');

	var fontsPath = katexPath + 'fonts/';
	var fontFiles = _.map(fs.readdirSync('packages/rocketchat-katex/' + fontsPath), function(filename) {
		return fontsPath + filename;
	});

	api.addAssets(fontFiles, 'client');
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.use('rocketchat:katex');

	api.addFiles('tests/jasmine/client/unit/katex.spec.coffee', 'client');
});
