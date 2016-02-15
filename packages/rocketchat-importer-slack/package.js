Package.describe({
	name: 'rocketchat:importer-slack',
	version: '0.0.1',
	summary: 'Importer for Slack',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1',
		'rocketchat:importer@0.0.1'
	]);

	api.addFiles('server/SlackImporter.coffee', 'server');
	api.addFiles('main.coffee', ['client', 'server']);

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-importer/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-importer/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});

Package.onTest(function(api) {
});
