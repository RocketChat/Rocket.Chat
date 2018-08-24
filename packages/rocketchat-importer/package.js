Package.describe({
	name: 'rocketchat:importer',
	version: '0.0.1',
	summary: 'RocketChat importer library',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'check',
		'rocketchat:lib'
	]);

	api.use('rocketchat:logger', 'server');
	api.use('templating', 'client');

	//Import Framework
	api.addFiles('server/classes/ImporterBase.js', 'server');
	api.addFiles('server/classes/ImporterProgress.js', 'server');
	api.addFiles('server/classes/ImporterSelection.js', 'server');
	api.addFiles('server/classes/ImporterSelectionChannel.js', 'server');
	api.addFiles('server/classes/ImporterSelectionUser.js', 'server');
	api.addFiles('server/classes/ImporterWebsocket.js', 'server');

	api.addFiles('lib/ImporterInfo.js');
	api.addFiles('lib/ImporterProgressStep.js');
	api.addFiles('lib/Importers.js');

	//Database models
	api.addFiles('server/models/Imports.js', 'server');
	api.addFiles('server/models/RawImports.js', 'server');

	//Server methods
	api.addFiles('server/methods/getImportProgress.js', 'server');
	api.addFiles('server/methods/getSelectionData.js', 'server');
	api.addFiles('server/methods/prepareImport.js', 'server');
	api.addFiles('server/methods/restartImport.js', 'server');
	api.addFiles('server/methods/setupImporter.js', 'server');
	api.addFiles('server/methods/startImport.js', 'server');

	//Client
	api.addFiles('client/admin/adminImport.html', 'client');
	api.addFiles('client/admin/adminImport.js', 'client');
	api.addFiles('client/admin/adminImportPrepare.html', 'client');
	api.addFiles('client/admin/adminImportPrepare.js', 'client');
	api.addFiles('client/admin/adminImportProgress.html', 'client');
	api.addFiles('client/admin/adminImportProgress.js', 'client');

	//Imports database records cleanup, mark all as not valid.
	api.addFiles('server/startup/setImportsToInvalid.js', 'server');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
