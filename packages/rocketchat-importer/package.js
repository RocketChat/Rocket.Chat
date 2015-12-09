Package.describe({
	name: 'rocketchat:importer',
	version: '0.0.1',
	summary: 'RocketChat importer library',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'ecmascript',
		'templating',
		'coffeescript',
		'check',
		'rocketchat:lib@0.0.1'
	]);

	//Import Framework
	api.addFiles('lib/importTool.coffee');
	api.addFiles('server/models/Imports.coffee', 'server');
	api.addFiles('server/models/RawImports.coffee', 'server');

	//Client
	api.addFiles('client/admin/adminImport.html', 'client');
	api.addFiles('client/admin/adminImport.coffee', 'client');
	api.addFiles('client/admin/adminImportPrepare.html', 'client');
	api.addFiles('client/admin/adminImportPrepare.coffee', 'client');

	// TAPi18n
	api.use('templating', 'client');
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
