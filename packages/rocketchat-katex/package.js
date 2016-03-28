Package.describe({
	name: 'rocketchat:katex',
	version: '0.0.1',
	summary: 'KaTeX plugin for TeX math rendering',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');
	api.use('underscore');
	api.use('templating');
	api.use('underscorestring:underscore.string');
	api.use('rocketchat:lib');

	api.addFiles('settings.coffee', 'server');
	api.addFiles('katex.coffee');
	api.addFiles('client/lib/katex.min.js', 'client');
	api.addFiles('client/katex.min.css', 'client');
	api.addFiles('client/style.css', 'client');

	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var fontFiles = _.map(fs.readdirSync('packages/rocketchat-katex/client/fonts'), function(filename) {
		return 'client/fonts/' + filename;
	});

	api.addAssets(fontFiles, 'client');

	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-katex/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-katex/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.use('rocketchat:katex');

	api.addFiles('tests/jasmine/client/unit/katex.spec.coffee', 'client');
});
