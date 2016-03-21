Package.describe({
	name: 'rocketchat:importer-hipchat',
	version: '0.0.1',
	summary: 'Importer for HipChat',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'coffeescript',
		'underscore',
		'rocketchat:lib@0.0.1',
		'rocketchat:importer@0.0.1'
	]);
	api.use(['mrt:moment-timezone@0.2.1'], 'server');

	api.addFiles('server/HipChatImporter.coffee', 'server');
	api.addFiles('main.coffee', ['client', 'server']);

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-importer/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-importer/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});
