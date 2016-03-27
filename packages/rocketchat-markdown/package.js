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
	api.use('templating');
	api.use('underscorestring:underscore.string');
	api.use('rocketchat:lib');

	api.addFiles('settings.coffee', 'server');
	api.addFiles('markdown.coffee');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-markdown/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-markdown/i18n/' + filename).size > 16) {
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
	api.use('rocketchat:markdown');

	api.addFiles('tests/jasmine/client/unit/markdown.spec.coffee', 'client');
});
