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
	api.addFiles('lib/_importer.coffee');
	api.addFiles('lib/importTool.coffee');
	api.addFiles('server/classes/ImporterBase.coffee', 'server');
	api.addFiles('server/classes/ImporterProgress.coffee', 'server');
	api.addFiles('server/classes/ImporterProgressStep.coffee', 'server');
	api.addFiles('server/classes/ImporterSelection.coffee', 'server');
	api.addFiles('server/classes/ImporterSelectionChannel.coffee', 'server');
	api.addFiles('server/classes/ImporterSelectionUser.coffee', 'server');

	//Database models
	api.addFiles('server/models/Imports.coffee', 'server');
	api.addFiles('server/models/RawImports.coffee', 'server');

	//Server methods
	api.addFiles('server/methods/getImportProgress.coffee', 'server');
	api.addFiles('server/methods/getSelectionData.coffee', 'server');
	api.addFiles('server/methods/prepareImport.coffee', 'server');
	api.addFiles('server/methods/restartImport.coffee', 'server');
	api.addFiles('server/methods/setupImporter.coffee', 'server');
	api.addFiles('server/methods/startImport.coffee', 'server');

	//Client
	api.addFiles('client/admin/adminImport.html', 'client');
	api.addFiles('client/admin/adminImport.coffee', 'client');
	api.addFiles('client/admin/adminImportPrepare.html', 'client');
	api.addFiles('client/admin/adminImportPrepare.coffee', 'client');
	api.addFiles('client/admin/adminImportProgress.html', 'client');
	api.addFiles('client/admin/adminImportProgress.coffee', 'client');

	//Imports database records cleanup, mark all as not valid.
	api.addFiles('server/startup/setImportsToInvalid.coffee', 'server');

	api.use('templating', 'client');
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

	api.export('Importer');
});

Npm.depends({
	'adm-zip': '0.4.7'
});
