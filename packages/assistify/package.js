Package.describe({
	name: 'assistify',
	version: '0.0.1',
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.4.2.6');
	api.use('ecmascript');
	api.use('dbs:ai');
	api.mainModule('assistify.js');

	//Server
	api.addFiles('config.js', 'server');

	//i18n
	api.use('tap:i18n');

	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/assistify/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);
});
